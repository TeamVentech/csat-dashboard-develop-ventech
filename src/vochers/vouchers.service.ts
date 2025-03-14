import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Vouchers } from './entities/vouchers.entity';
import { CreateVouchersDto } from './dto/create.dto';
import { UpdateVouchersDto } from './dto/update.dto';
import { RequestServices } from 'requestServices/entities/requestServices.entity';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';

@Injectable()
export class VouchersService {
  constructor(
    @Inject('VOUCHERS_REPOSITORY')
    private readonly vouchersRepository: Repository<Vouchers>,
    @Inject('REQUEST_SERVICES_REPOSITORY')
    private readonly requestServiceRepository: Repository<RequestServices>,
    private readonly elasticService: ElasticService,
  ) { }

  async create(createVouchersDto: CreateVouchersDto) {
    const department = this.vouchersRepository.create(createVouchersDto);
    return this.vouchersRepository.save(department);
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.vouchersRepository.createQueryBuilder('user');

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(user.serialNumber ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substridfng search
        });

      }

      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string) {
    const Vouchers = await this.vouchersRepository.findOne({ where: { id: id } });
    if (!Vouchers) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return Vouchers;
  }

  async importVouchers(data: any[]): Promise<void> {
    for (const item of data) {
      let existingVoucher = await this.vouchersRepository.findOne({
        where: { serialNumber: item.Serial_Number },
      });
      if (existingVoucher) {
        // Update existing voucher
        existingVoucher.metadata = item;
        existingVoucher.updatedAt = new Date();
      } else {
        // Create new voucher
        existingVoucher = this.vouchersRepository.create({
          name: "Vouchers",
          addedBy: "System",
          metadata: item,
          serialNumber: item.Serial_Number
        });
      }

      await this.vouchersRepository.save(existingVoucher);
    }
  }

  async GetAvailableVoucher(data) {
    const list = [];
    for (const item of data.vouchers) {
      const variables = item.denominations;
      console.log(item)
      const result = await this.vouchersRepository
        .createQueryBuilder('vouchers')
        .where("vouchers.metadata->>'status' NOT IN (:...statuses)", { statuses: ['Sold', 'Extended'] })
        .andWhere("vouchers.metadata->>'Denomination' = :denomination", { denomination: `${variables} JOD` })
        .limit(item.Vouchers)
        .getMany();
      list.push({ denominations: variables, vouchers: result, Vouchers: item.Vouchers });
    }
    for (let i = 0; i < list.length; i++) {
      if (list[i].vouchers.length !== list[i].Vouchers) {
        return {
          message: `You Don't have enough denomination :${list[i].denominations}`,
          success: false,
        }

      }

    }
    return {
      message: "success",
      success: true,
      data: list

    };
  }

  // async findType(type: string){
  //   const Vouchers = await this.vouchersRepository.find({ where: { type: type } });
  //   if (!Vouchers) {dd
  //     throw new NotFoundException(`Department with ID ${type} not found`);
  //   }
  //   return Vouchers;
  // }


  // Update a department by ID
  async update(id: string, updateVouchersDto: UpdateVouchersDto) {
    if (updateVouchersDto.actions) {
      const service = await this.requestServiceRepository.findOne({ where: { id: updateVouchersDto.service_id } });

      if (service) {
        console.log(JSON.stringify(service))
        for (const voucherGroup of service.metadata.voucher) {
          const foundVoucher = voucherGroup.vouchers.find(voucher => voucher.VoucherId === updateVouchersDto.VoucherId);
          if (foundVoucher) {
            foundVoucher.metadata = { ...foundVoucher.metadata, ...updateVouchersDto.metadata };
            // return service;
            const extanded_vouchers = await this.vouchersRepository.findOne({ where: { id: updateVouchersDto.newVoucher } });
            if (extanded_vouchers) {
              extanded_vouchers.state = "Extended"
              extanded_vouchers.metadata.status = "Extended"
              extanded_vouchers.metadata.Client_ID = service.metadata.customer.id || service.metadata.Company.id
              extanded_vouchers.metadata.Type_of_Sale = service.type === 'Corporate Voucher Sale' ? 'Company' : 'Individual'
              extanded_vouchers.metadata.main_voucher = id
              await this.vouchersRepository.update(updateVouchersDto.newVoucher, extanded_vouchers);
              await this.requestServiceRepository.update(service.id, service);
              await this.elasticService.updateDocument('services', service.id, service);
              delete updateVouchersDto.VoucherId
              delete updateVouchersDto.actions
              delete updateVouchersDto.newVoucher
              delete updateVouchersDto.service_id
              await this.vouchersRepository.update(id, updateVouchersDto);
              return true

            }

          }
        }
      }
    }
    else {
      await this.vouchersRepository.update(id, updateVouchersDto);
      return true
    }
    // return service
    // await this.requestServicesRepository.update(id, updateRequestServicesDto);
    // await this.elasticService.updateDocument('services', id, updateRequestServicesDto);



    // await this.vouchersRepository.update(id, updateVouchersDto);
    return null;
  }


  async extend(id: string, service_id: string, data: any) {

    try {
      const service = await this.requestServiceRepository.findOne({ where: { id: service_id } })
      const voucher_data = await this.vouchersRepository.findOne({ where: { id } })
      if (service) {
        const createdAt = new Date(service.createdAt);
        const now = new Date();
        const diffTime = now.getTime() - createdAt.getTime();
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
        if (diffYears > 1) {
          throw new Error("The transaction is older than one year.");
        }
        console.log(JSON.stringify(voucher_data))
        if (voucher_data.metadata.status === "Extended") {
          throw new Error("The voucher has already been extended.");
        }
        console.log(JSON.stringify(service))
        const extended_voucher = await this.GetAvailableVoucher({ "vouchers": [{ "Vouchers": 1, "denominations": parseInt(voucher_data.metadata.Denomination), "serialNumbers": ["4408398"] }] })
        console.log(parseInt(voucher_data.metadata.Denomination))
        console.log(JSON.stringify(extended_voucher))
        if (!extended_voucher.data[0]) {
          throw new Error("You Don't have enough denomination");
        }
        voucher_data.metadata.extanded = true
        voucher_data.metadata.status = "Extended"
        voucher_data.metadata.status = "Extended"
        let specificDate = new Date(service.metadata.Expiry_date);
        specificDate.setDate(specificDate.getDate() + 14); // Add 14 days
        voucher_data.metadata.extanded_expired_date = specificDate.toISOString()
        voucher_data.metadata.extendedBy = data.extendedBy
        voucher_data.metadata.newVoucher = extended_voucher.data[0].vouchers[0].id
        voucher_data.metadata.newVoucherSerialNumber = extended_voucher.data[0].vouchers[0].serialNumber
        await this.vouchersRepository.update(voucher_data.id, voucher_data);
  
        // -------------------------------------------------------------------------------------
  
        extended_voucher.data[0].vouchers[0].state = "Extended"
        extended_voucher.data[0].vouchers[0].metadata.status = "Extended"
        extended_voucher.data[0].vouchers[0].metadata.Client_ID = service.metadata.customer.id || service.metadata.Company.id
        extended_voucher.data[0].vouchers[0].metadata.Type_of_Sale = service.type === 'Corporate Voucher Sale' ? 'Company' : 'Individual'
        extended_voucher.data[0].vouchers[0].metadata.main_voucher = id
        await this.vouchersRepository.update(extended_voucher.data[0].vouchers[0].id, extended_voucher.data[0].vouchers[0]);
        for (let j = 0; j < service.metadata.voucher.length; j++) {
          const element = service.metadata.voucher[j];
          for (let i = 0; i < service.metadata.voucher[j].vouchers.length; i++) {
            if(service.metadata.voucher[j].vouchers[i].id === id){
              service.metadata.voucher[j].vouchers[i] = {...voucher_data, extendedBy:data.extendedBy}
            }
          }
        }
        await this.requestServiceRepository.update(service.id, service);
        await this.elasticService.updateDocument('services', service.id, service);
      }
    } catch (error) {
      throw new Error(error);
    }
    return null;
  }

  // async updateRefunded(id: string) {
  // if (updateVouchersDto.actions) {
  // const service = await this.requestServiceRepository.findOne({ where: { id: updateVouchersDto.service_id } });
  // }
  // }
  async remove(id: string) {
    const Vouchers = await this.findOne(id);
    await this.vouchersRepository.remove(Vouchers);
  }
}
