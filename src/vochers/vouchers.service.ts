import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vouchers } from './entities/vouchers.entity';
import { CreateVouchersDto } from './dto/create.dto';
import { UpdateVouchersDto } from './dto/update.dto';

@Injectable()
export class VouchersService {
  constructor(
    @Inject('VOUCHERS_REPOSITORY')
    private readonly vouchersRepository: Repository<Vouchers>,
  ) {}

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
        const searchString =await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(user.serialNumber ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
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

  async findOne(id: string){
    const Vouchers = await this.vouchersRepository.findOne({ where: { id: id } });
    if (!Vouchers) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return Vouchers;
  }

  async importVouchers(data: any[]): Promise<void> {
    const vouchers = data.map(async (item) => {
      console.log(item)
      const res = this.vouchersRepository.create({
        name: "Vouchers",
        addedBy: "System",
        metadata: item,
        serialNumber:item.Serial_Number
      });
      await this.vouchersRepository.save(res);
    });
  }


  // async findType(type: string){
  //   const Vouchers = await this.vouchersRepository.find({ where: { type: type } });
  //   if (!Vouchers) {
  //     throw new NotFoundException(`Department with ID ${type} not found`);
  //   }
  //   return Vouchers;
  // }


  // Update a department by ID
  async update(id: string, updateVouchersDto: UpdateVouchersDto) {
    await this.findOne(id);
    await this.vouchersRepository.update(id, updateVouchersDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const Vouchers = await this.findOne(id);
    await this.vouchersRepository.remove(Vouchers);
  }
}
