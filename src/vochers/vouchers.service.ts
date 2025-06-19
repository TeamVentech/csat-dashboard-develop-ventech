import { Inject, Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Vouchers } from './entities/vouchers.entity';
import { CreateVouchersDto } from './dto/create.dto';
import { UpdateVouchersDto } from './dto/update.dto';
import { RequestServices } from 'requestServices/entities/requestServices.entity';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
import SmsMessage from 'requestServices/messages/smsMessages';
import { SmsService } from 'sms/sms.service';

@Injectable()
export class VouchersService {
  constructor(
    @Inject('VOUCHERS_REPOSITORY')
    private readonly vouchersRepository: Repository<Vouchers>,
    @Inject('REQUEST_SERVICES_REPOSITORY')
    private readonly requestServiceRepository: Repository<RequestServices>,
    private readonly elasticService: ElasticService,
    private readonly smsService: SmsService,
  ) { }

  async create(createVouchersDto: CreateVouchersDto) {
    const department = this.vouchersRepository.create(createVouchersDto);
    return this.vouchersRepository.save(department);
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
	  const queryBuilder = this.vouchersRepository.createQueryBuilder('voucher');

	 if(filterOptions){
	  if (filterOptions.search) {
		  const search = filterOptions.search.trim();
		  queryBuilder.andWhere(
			  `(voucher.serialNumber ILIKE :search OR (voucher.metadata->>'Client_ID') ILIKE :search)`,
			  { search: `%${search}%` }
		  );
	  }

	  if (filterOptions.type_sale) {
		  queryBuilder.andWhere(
			  `(voucher.metadata->>'type_sale') = :type_sale`,
			  { type_sale: filterOptions.type_sale }
		  );
	  }

	  if (filterOptions.denomination) {
		  queryBuilder.andWhere(
			  `(voucher.metadata->>'Denomination') = :denomination`,
			  { denomination: filterOptions.denomination }
		  );
	  }

	  if (filterOptions.state) {
		  queryBuilder.andWhere(
			  `voucher.state = :state`,
			  { state: filterOptions.state }
		  );
	  }
	  }

	  queryBuilder.orderBy('voucher.updatedAt', 'DESC');

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
    const denominations = ["10 JOD", "25 JOD", "50 JOD"]
    const errors = []
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
        if (denominations.includes(item.Denomination)) {
          existingVoucher = this.vouchersRepository.create({
            name: "Vouchers",
            addedBy: "System",
            metadata: item,
            serialNumber: item.Serial_Number
          });
        }
      }

      await this.vouchersRepository.save(existingVoucher);
    }
  }

  async GetAvailableVoucher(data) {
    const list = [];
    for (const item of data.vouchers) {
      const variables = item.denominations;
      const result = await this.vouchersRepository
        .createQueryBuilder('vouchers')
        .where('vouchers.state NOT IN (:...statuses)', { statuses: ['Sold', 'Extended', 'Refunded'] })
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


  async update(id: string, updateVouchersDto: UpdateVouchersDto) {
    if (updateVouchersDto.actions) {
      const service = await this.requestServiceRepository.findOne({ where: { id: updateVouchersDto.service_id } });

      if (service) {
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
      const service = await this.requestServiceRepository.findOne({ where: { id: service_id } });
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      const voucher_data = await this.vouchersRepository.findOne({ where: { id } });
      if (!voucher_data) {
        throw new HttpException("Voucher not found", HttpStatus.NOT_FOUND);
      }
      const createdAt = new Date(service.createdAt);
      const now = new Date();
      const diffTime = now.getTime() - createdAt.getTime();
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
      if (diffYears > 1) {
        throw new HttpException("The transaction is older than one year.", HttpStatus.BAD_REQUEST);
      }
      if (voucher_data.metadata.status === "Extended") {
        throw new HttpException("The voucher has already been extended.", HttpStatus.CONFLICT);
      }
      const extended_voucher = await this.GetAvailableVoucher({
        "vouchers": [{ "Vouchers": 1, "denominations": parseInt(voucher_data.metadata.Denomination), "serialNumbers": ["4408398"] }]
      });
      if (!extended_voucher.data[0]) {
        throw new HttpException("You don't have enough denomination", HttpStatus.BAD_REQUEST);
      }
      voucher_data.metadata.extanded = true;
      voucher_data.metadata.status = "Extended";
      let specificDate = new Date(service.metadata.Expiry_date);
      specificDate.setDate(specificDate.getDate() + 14);
      voucher_data.metadata.extanded_expired_date = specificDate.toISOString();
      voucher_data.metadata.extendedBy = data.extendedBy;
      voucher_data.metadata.extention_date = new Date();
      voucher_data.metadata.newVoucher = extended_voucher.data[0].vouchers[0].id;
      voucher_data.metadata.newVoucherSerialNumber = extended_voucher.data[0].vouchers[0].serialNumber;
      await this.vouchersRepository.update(voucher_data.id, voucher_data);
      extended_voucher.data[0].vouchers[0].state = "Extended";
      extended_voucher.data[0].vouchers[0].metadata.status = "Extended";
      extended_voucher.data[0].vouchers[0].metadata.Client_ID = service.metadata.customer.id || service.metadata.Company.id;
      extended_voucher.data[0].vouchers[0].metadata.Type_of_Sale = service.type === 'Corporate Voucher Sale' ? 'Company' : 'Individual';
      extended_voucher.data[0].vouchers[0].metadata.main_voucher = voucher_data.serialNumber;
      extended_voucher.data[0].vouchers[0].metadata.expired_date = specificDate
      await this.vouchersRepository.update(extended_voucher.data[0].vouchers[0].id, extended_voucher.data[0].vouchers[0]);
      for (let j = 0; j < service.metadata.voucher.length; j++) {
        for (let i = 0; i < service.metadata.voucher[j].vouchers.length; i++) {
          if (service.metadata.voucher[j].vouchers[i].id === id) {
            service.metadata.voucher[j].vouchers[i] = { ...voucher_data, extendedBy: data.extendedBy };
          }
        }
      }
      await this.requestServiceRepository.update(service.id, service);
      await this.elasticService.updateDocument('services', service.id, service);
      const updated_data = await this.elasticService.getById('services', service.id)
      const language = service?.metadata?.IsArabic ? "ar" : "en";
      const formattedDate = new Date(voucher_data.metadata.extanded_expired_date).toLocaleDateString('en-GB');
      const message = {
        en: `We would like to inform you that your extension request is approved. The new expiry date is ${formattedDate}\nPlease rate our service by following the below link:\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${service_id}/rating`,
        ar: `تمت الموافقة على تمديد صلاحية القسيمة. تاريخ الانتهاء: ${formattedDate}\nيرجى تقييم الخدمة من خلال الرابط\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${service_id}/rating`
      };
      let phoneNumber;
      if (service.type === 'Corporate Voucher Sale') {
        phoneNumber = service?.metadata?.recipient?.recipient_phone_number
      } else {
        phoneNumber = service?.metadata?.customer?.phone_number
      }
      if (phoneNumber) {
        await this.sendSms(null, message[language], phoneNumber);
      }
      return { message: "Voucher extended successfully", status: HttpStatus.OK, data: updated_data };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // NestJS will automatically return the correct status and message
      }
      throw new HttpException(error.message || "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async refund(id: string, service_id: string, data: any) {
    try {
      const service = await this.requestServiceRepository.findOne({ where: { id: service_id } });
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      const voucher_data = await this.vouchersRepository.findOne({ where: { id } });
      if (!voucher_data) {
        throw new HttpException("Voucher not found", HttpStatus.NOT_FOUND);
      }
      if (voucher_data.metadata.status === "Refunded") {
        throw new HttpException("The voucher has already been refunded.", HttpStatus.CONFLICT);
      }
      voucher_data.metadata.status = "Refunded";
      voucher_data.state = "Re-Pending";
      // delete voucher_data?.metadata?.type_sale
      // delete voucher_data?.metadata?.Client_ID
      // delete voucher_data?.metadata?.date_sale
      // delete voucher_data?.metadata?.expired_date
      // delete voucher_data?.metadata?.purchase_reason
      console.log(service.metadata.value)
      await this.vouchersRepository.update(voucher_data.id, voucher_data);
      for (let j = 0; j < service.metadata.voucher.length; j++) {
        for (let i = 0; i < service.metadata.voucher[j].vouchers.length; i++) {
          if (service.metadata.voucher[j].vouchers[i].id === id) {
            voucher_data.metadata.status = "Refunded"
            voucher_data.state = "Re-Pending"
            voucher_data.metadata.refunded_date = new Date()
            const denominations = parseInt(voucher_data.metadata.Denomination)
            console.log(denominations)
            console.log(service.metadata.value)
            service.metadata.value = service.metadata.value - denominations
            console.log(service.metadata.value)
            service.metadata.voucher[j].Vouchers -= 1
            service.metadata.voucher[j].vouchers[i] = { ...voucher_data, refundedBy: data.refundedBy };
          }
        }
      }
      console.log(service.metadata.value)
      await this.requestServiceRepository.update(service.id, service);
      await this.elasticService.updateDocument('services', service.id, service);
      const updated_data = await this.elasticService.getById('services', service.id)
      if (service?.metadata?.Company?.phone_number || service?.metadata?.customer?.phone_number) {
        const numbers = service?.metadata?.Company?.phone_number || service?.metadata?.customer?.phone_number
        const language = service?.metadata?.IsArabic ? "ar" : "en"
        const message = SmsMessage["Individual Voucher Sale"]["Refunded"][language]
        await this.sendSms(numbers, `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`, numbers)
      }
      return { message: "Voucher extended successfully", status: HttpStatus.OK, data: updated_data };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // NestJS will automatically return the correct status and message
      }
      throw new HttpException(error.message || "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // async refund(id: string, service_id: string, data: any) {

  // }

  async bulkRefund(transaction_id: string, data: any) {
    if (data.voucherIds.length > 0) {
      let countRefunded = 0
      const service = await this.requestServiceRepository.findOne({ where: { id: transaction_id } });
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      for (const voucherId of data.voucherIds) {
        try {
          const voucher_data = await this.vouchersRepository.findOne({ where: { id: voucherId } });
          if (voucher_data) {
            if (voucher_data.metadata.status !== "Refunded") {
              voucher_data.metadata.status = "Refunded";
              voucher_data.state = "Re-Pending";
              await this.vouchersRepository.update(voucher_data.id, voucher_data);
              for (let j = 0; j < service.metadata.voucher.length; j++) {
                for (let i = 0; i < service.metadata.voucher[j].vouchers.length; i++) {
                  if (service.metadata.voucher[j].vouchers[i].id === voucherId) {
                    voucher_data.metadata.status = "Refunded"
                    voucher_data.state = "Re-Pending"
                    voucher_data.metadata.refunded_date = new Date()
                    const denominations = parseInt(voucher_data.metadata.Denomination)
                    service.metadata.value = service.metadata.value - denominations
                    service.metadata.voucher[j].Vouchers -= 1
                    service.metadata.voucher[j].vouchers[i] = { ...voucher_data, refundedBy: data.refundedBy };
                    countRefunded += 1
                  }
                }
              }
              await this.requestServiceRepository.update(service.id, service);
              await this.elasticService.updateDocument('services', service.id, service);
              await this.elasticService.getById('services', service.id)
            }
          }
        } catch (error) {
          console.log(error)
        }
      }
      if (countRefunded > 0) {
        if (service?.metadata?.Company?.phone_number || service?.metadata?.customer?.phone_number) {
          const numbers = service?.metadata?.Company?.phone_number || service?.metadata?.customer?.phone_number
          const language = service?.metadata?.IsArabic ? "ar" : "en"
          const message = SmsMessage["Individual Voucher Sale"]["Refunded"][language]
          await this.sendSms(numbers, `${message}\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${data.id}/rating`, numbers)
        }
      }
      return {
        message: "Vouchers refunded successfully", status: HttpStatus.OK, data: {
          countRefunded,
          countNotRefunded: data.voucherIds.length - countRefunded
        }
      };
    }
  }

  async bulkExtend(transaction_id: string, data: any) {
    if (data.voucherIds.length > 0) {
      let countExtended = 0
      let extanded_expired = null
      const service = await this.requestServiceRepository.findOne({ where: { id: transaction_id } });
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      for (const voucherId of data.voucherIds) {
        const voucher_data = await this.vouchersRepository.findOne({ where: { id: voucherId } });
        if (voucher_data) {
          const createdAt = new Date(service.createdAt);
          const now = new Date();
          const diffTime = now.getTime() - createdAt.getTime();
          const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
          if (diffYears > 1) {
            continue;
          }
          if (voucher_data.metadata.status === "Extended") {
            continue;
          }
          const extended_voucher = await this.GetAvailableVoucher({
            "vouchers": [{ "Vouchers": 1, "denominations": parseInt(voucher_data.metadata.Denomination), "serialNumbers": ["4408398"] }]
          });
          if (!extended_voucher.data[0]) {
            continue;
          }
          voucher_data.metadata.extanded = true;
          voucher_data.metadata.status = "Extended";
          const specificDate = new Date(service.metadata.Expiry_date);
          specificDate.setDate(specificDate.getDate() + 14);
          voucher_data.metadata.extanded_expired_date = specificDate.toISOString();
          voucher_data.metadata.extendedBy = data.extendedBy;
          voucher_data.metadata.extention_date = new Date();
          voucher_data.metadata.newVoucher = extended_voucher.data[0].vouchers[0].id;
          voucher_data.metadata.newVoucherSerialNumber = extended_voucher.data[0].vouchers[0].serialNumber;
          await this.vouchersRepository.update(voucher_data.id, voucher_data);
          extended_voucher.data[0].vouchers[0].state = "Extended";
          extended_voucher.data[0].vouchers[0].metadata.status = "Extended";
          extended_voucher.data[0].vouchers[0].metadata.Client_ID = service.metadata.customer.id || service.metadata.Company.id;
          extended_voucher.data[0].vouchers[0].metadata.Type_of_Sale = service.type === 'Corporate Voucher Sale' ? 'Company' : 'Individual';
          extended_voucher.data[0].vouchers[0].metadata.main_voucher = voucher_data.serialNumber;
          extended_voucher.data[0].vouchers[0].metadata.expired_date = specificDate
          await this.vouchersRepository.update(extended_voucher.data[0].vouchers[0].id, extended_voucher.data[0].vouchers[0]);
          for (let j = 0; j < service.metadata.voucher.length; j++) {
            for (let i = 0; i < service.metadata.voucher[j].vouchers.length; i++) {
              if (service.metadata.voucher[j].vouchers[i].id === voucherId) {
                service.metadata.voucher[j].vouchers[i] = { ...voucher_data, extendedBy: data.extendedBy };
                countExtended += 1
                extanded_expired = voucher_data.metadata.extanded_expired_date
              }
            }
          }
          await this.requestServiceRepository.update(service.id, service);
          await this.elasticService.updateDocument('services', service.id, service);
        }


      }
      if (countExtended > 0) {
        const language = service?.metadata?.IsArabic ? "ar" : "en";
        const formattedDate = new Date(extanded_expired).toLocaleDateString('en-GB');
          const message = {
            en: `We would like to inform you that your extension request is approved. The new expiry date is ${formattedDate}\nPlease rate our service by following the below link:\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${transaction_id}/rating`,
            ar: `تمت الموافقة على تمديد صلاحية القسيمة. تاريخ الانتهاء: ${formattedDate}\nيرجى تقييم الخدمة من خلال الرابط\nhttps://main.d3n0sp6u84gnwb.amplifyapp.com/#/services/${transaction_id}/rating`
          };
          let phoneNumber;
          if (service.type === 'Corporate Voucher Sale') {
            phoneNumber = service?.metadata?.recipient?.recipient_phone_number
          } else {
            phoneNumber = service?.metadata?.customer?.phone_number
          }
          if (phoneNumber) {
          await this.sendSms(null, message[language], phoneNumber);
        }
        return { message: "Voucher extended successfully", status: HttpStatus.OK, data: {
          countExtended,
          countNotExtended: data.voucherIds.length - countExtended
        } };
    }
      return {
        message: "Vouchers extended successfully", status: HttpStatus.OK, data: {
          countExtended,
          countNotExtended: data.voucherIds.length - countExtended
        }
      };
    }
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
  async sendSms(data: any, message: any, number: string) {
    return await this.smsService.sendSms(data, message, number);
  }

  async updateNameCategory(id: string, updateData: { name?: string; categoryId?: string }) {
    try {
      const voucher = await this.vouchersRepository.findOne({ where: { id } });

      if (!voucher) {
        throw new HttpException(`Voucher with ID ${id} not found`, HttpStatus.NOT_FOUND);
      }

      // Update name if provided
      if (updateData.name) {
        voucher.name = updateData.name;
      }

      // Update category in metadata if provided
      if (updateData.categoryId) {
        if (!voucher.metadata) {
          voucher.metadata = {};
        }
        voucher.metadata.categoryId = updateData.categoryId;
      }

      // Save the updated voucher
      await this.vouchersRepository.save(voucher);

      // Update any related service records in Elasticsearch if needed
      // Use a more complex query approach since direct JSON path querying has type issues
      const serviceRecords = await this.requestServiceRepository
        .createQueryBuilder('service')
        .where(`service.metadata::jsonb @> '{"voucher": [{"vouchers": [{"id": "${id}"}]}]}'`)
        .getMany();

      if (serviceRecords && serviceRecords.length > 0) {
        for (const service of serviceRecords) {
          // Update the voucher within the service metadata
          if (service.metadata && service.metadata.voucher) {
            for (let i = 0; i < service.metadata.voucher.length; i++) {
              for (let j = 0; j < service.metadata.voucher[i].vouchers.length; j++) {
                if (service.metadata.voucher[i].vouchers[j].id === id) {
                  if (updateData.name) {
                    service.metadata.voucher[i].vouchers[j].name = updateData.name;
                  }
                  if (updateData.categoryId) {
                    service.metadata.voucher[i].vouchers[j].metadata.categoryId = updateData.categoryId;
                  }
                }
              }
            }

            // Update the service record and its Elasticsearch entry
            await this.requestServiceRepository.save(service);
            await this.elasticService.updateDocument('services', service.id, service);
          }
        }
      }

      return {
        success: true,
        message: 'Voucher updated successfully',
        data: voucher
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Error updating voucher',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Sends SMS reminders for vouchers about to expire
   * - For Extended vouchers: 3 days before expiry
   * - For Sold vouchers: 7 days before expiry
   */
  async sendExpiryReminders() {
    try {
      // Get current date
      const currentDate = new Date();

      // Find vouchers that need reminders
      const extendedVouchersExpiring = await this.vouchersRepository
        .createQueryBuilder('voucher')
        .where('voucher.state = :state', { state: 'Sold' })
        .andWhere("voucher.metadata->>'status' = :status", { status: 'Extended' })
        .andWhere("(voucher.metadata->>'extanded_expired_date')::timestamp - INTERVAL '3 days' <= :currentDate", { currentDate })
        .andWhere("(voucher.metadata->>'extanded_expired_date')::timestamp > :currentDate", { currentDate })
        .andWhere("voucher.metadata->>'reminderSent' IS NULL")
        .getMany();

      const soldVouchersExpiring = await this.vouchersRepository
        .createQueryBuilder('voucher')
        .where('voucher.state = :state', { state: 'Sold' })
        .andWhere("voucher.metadata->>'status' = :status", { status: 'Sold Voucher' })
        .andWhere("(voucher.metadata->>'expired_date')::timestamp - INTERVAL '7 days' <= :currentDate", { currentDate })
        .andWhere("(voucher.metadata->>'expired_date')::timestamp > :currentDate", { currentDate })
        .andWhere("voucher.metadata->>'reminderSent' IS NULL")
        .getMany();

      // Process extended vouchers (3 days before expiry)
      for (const voucher of extendedVouchersExpiring) {
        try {
          const serviceId = voucher.metadata?.service_id;
          if (!serviceId) continue;

          const service = await this.requestServiceRepository.findOne({ where: { id: serviceId } });
          if (!service) continue;

          // Check if there's a recipient who should receive the SMS instead of purchaser
          let phoneNumber;
          if (voucher.metadata?.recipient_number) {
            phoneNumber = voucher.metadata.recipient_number;
          } else if (service?.metadata?.Company?.phone_number) {
            phoneNumber = service.metadata.Company.phone_number;
          } else if (service?.metadata?.customer?.phone_number) {
            phoneNumber = service.metadata.customer.phone_number;
          } else {
            continue; // No phone number to send to
          }

          const language = service?.metadata?.IsArabic ? "ar" : "en";
          const message = {
            ar: `ستنتهي صلاحية قسيمة الإهداء خلال 3 أيام.\n استخدمها قريباً\n يرجى تجاهل الرسالة في حال قمت باستخدامها.\n نتمنى لكم تسوّق سعيد`,
            en: `Your gift voucher expires in (3) days.\nDon't forget to use it soon.\nIf you have used it already, please disregard this text.\nHappy Shopping`
          }

          await this.sendSms(null, message, phoneNumber);

          // Mark as reminder sent
          voucher.metadata.reminderSent = true;
          await this.vouchersRepository.save(voucher);
        } catch (error) {
          console.error(`Error sending reminder for voucher ${voucher.id}:`, error);
        }
      }

      // Process sold vouchers (7 days before expiry)
      for (const voucher of soldVouchersExpiring) {
        try {
          const serviceId = voucher.metadata?.service_id;
          if (!serviceId) continue;

          const service = await this.requestServiceRepository.findOne({ where: { id: serviceId } });
          if (!service) continue;

          // Check if there's a recipient who should receive the SMS instead of purchaser
          let phoneNumber;
          if (voucher.metadata?.recipient_number) {
            phoneNumber = voucher.metadata.recipient_number;
          } else if (service?.metadata?.Company?.phone_number) {
            phoneNumber = service.metadata.Company.phone_number;
          } else if (service?.metadata?.customer?.phone_number) {
            phoneNumber = service.metadata.customer.phone_number;
          } else {
            continue; // No phone number to send to
          }

          const language = service?.metadata?.IsArabic ? "ar" : "en";
          // Modify message to mention 7 days instead of 3
          const message = {
            ar: `ستنتهي صلاحية قسيمة الإهداء خلال 7 أيام.\n استخدمها قريباً\n يرجى تجاهل الرسالة في حال قمت باستخدامها.\n نتمنى لكم تسوّق سعيد`,
            en: `Your gift voucher expires in (7) days.\nDon't forget to use it soon.\nIf you have used it already, please disregard this text.\nHappy Shopping`
          }

          await this.sendSms(null, message, phoneNumber);

          // Mark as reminder sent
          voucher.metadata.reminderSent = true;
          await this.vouchersRepository.save(voucher);
        } catch (error) {
          console.error(`Error sending reminder for voucher ${voucher.id}:`, error);
        }
      }

      return {
        success: true,
        message: `SMS reminders sent: ${extendedVouchersExpiring.length + soldVouchersExpiring.length}`,
        extendedCount: extendedVouchersExpiring.length,
        soldCount: soldVouchersExpiring.length
      };
    } catch (error) {
      console.error('Error sending voucher expiry reminders:', error);
      throw new HttpException(
        error.message || 'Error sending voucher expiry reminders',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


  async updateRefundedVouchers() {
    try {
      // Find all vouchers with state Pending and metadata.status Refunded
      const pendingRefundedVouchers = await this.vouchersRepository
        .createQueryBuilder('voucher')
        .where('voucher.state = :state', { state: 'Pending' })
        .andWhere("voucher.metadata->>'status' = :status", { status: 'Refunded' })
        .getMany();

      if (pendingRefundedVouchers.length === 0) {
        return {
          success: true,
          message: 'No pending refunded vouchers to update',
          count: 0
        };
      }

      // Update all found vouchers to state Refunded
      for (const voucher of pendingRefundedVouchers) {
        console.log(voucher.serialNumber)
        voucher.state = 'Refunded';
        await this.vouchersRepository.save(voucher);
      }

      return {
        success: true,
        message: `Updated ${pendingRefundedVouchers.length} vouchers from Pending to Refunded state`,
        count: pendingRefundedVouchers.length
      };
    } catch (error) {
      console.error('Error updating refunded vouchers:', error);
      throw new HttpException(
        error.message || 'Error updating refunded vouchers',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
