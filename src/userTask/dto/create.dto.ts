import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  assignedTo: any;

  @IsOptional()
  complaintId: string;

  @IsOptional()
  type: string;

  @IsOptional()
  actions: any;

  @IsEnum(['Pending', 'In Progress', 'Completed'])
  @IsOptional()
  status?: string; // Optional; defaults to "Pending" in the entity

}
