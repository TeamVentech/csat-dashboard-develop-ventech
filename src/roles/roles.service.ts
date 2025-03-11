import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/roles.entity';
import { CreateRoleDto } from './dto/create.dto';
import { UpdateRoleDto } from './dto/update.dto';

@Injectable()
export class RolesService {
  constructor(
    @Inject('ROLE_REPOSITORY')
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto){
    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll(page: number, perPage: number) {
    page = page || 1
    perPage = perPage || 10
    const [roles, total] = await this.roleRepository.findAndCount({
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return { roles, total };
  }

  async find() {
    const roles =  await this.roleRepository.find()
    return roles;
  }

  async findOne(name: string) {
    const role = await this.roleRepository.findOne({ where: { name } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${name} not found`);
    }
    return role;
  }

  async findOneByName(name: string) {
    const role = await this.roleRepository.findOne({ where: { name } });
    if (!role) {
      throw new NotFoundException(`Role with name ${name} not found`);
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    await this.findOne(id);
    await this.roleRepository.update(id, updateRoleDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
  }
}
