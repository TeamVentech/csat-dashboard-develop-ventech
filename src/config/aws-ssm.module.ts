import { Module } from '@nestjs/common';
import { AwsParameterStore } from './aws-ssm.config';

@Module({
  providers: [AwsParameterStore],
  exports: [AwsParameterStore],
})
export class AwsParameterStoreModule {} 