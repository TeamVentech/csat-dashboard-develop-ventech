import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Section } from './entities/Sections.entity';
import { CreateSectionDto } from './dto/create.dto';
import { UpdateSectionDto } from './dto/update.dto';
import { Role } from 'roles/entities/roles.entity';

@Injectable()
export class SectionsService {
  constructor(
    @Inject('SECTIONS_REPOSITORY')
    private readonly sectionRepository: Repository<Section>,
    @Inject('ROLE_REPOSITORY')
    private readonly roleRepository: Repository<Role>,
  ) { }

  async create(createSectionDto: CreateSectionDto): Promise<Section> {
    const { name, role, departmentId } = createSectionDto;

    const sectionRoles = await this.roleRepository.findBy({
      name: In(role),
    });

    const section = this.sectionRepository.create({
      name,
      role: role,
      departmentId,
    });

    return this.sectionRepository.save(section);
  }


  async findAllSections() {

    return this.sectionRepository.find();
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.sectionRepository.createQueryBuilder('section')
      .leftJoinAndSelect('section.department', 'department') // Include customer relationship

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(section.name ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
        });

      }

      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`section.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }

    const [categories, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { categories, total };
  }

  async findOne(id: string) {
    const section = await this.sectionRepository.findOne({
      where: { id: id }
    });
    return section
  }

  async findallwithoutfilter() {
    const Section = await this.sectionRepository.find();
    if (!Section) {
      throw new NotFoundException(`Section with not found`);
    }
    return Section;
  }

  async update(id: string, updateSectionDto: UpdateSectionDto) {
    const { name, role, departmentId } = updateSectionDto;
    const section = await this.sectionRepository.findOne({
      where: { id },
    });
    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }
    if (name) {
      section.name = name;
    }
    if (departmentId) {
      section.departmentId = departmentId;
    }
    if (role) {
      section.role = role;
    }
    return this.sectionRepository.save(section);
  }


  async remove(id: string) {
    const Section = await this.findOne(id);
    await this.sectionRepository.remove(Section);
  }
}
