import { SSMClient, GetParametersByPathCommand } from '@aws-sdk/client-ssm';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AwsParameterStore {
  private readonly ssmClient: SSMClient;
  
  constructor() {
    this.ssmClient = new SSMClient({
      region: process.env.AWS_REGION || 'us-west-2',
    });
  }

  /**
   * Fetches parameters from AWS Parameter Store and writes them to .env file
   * @param path Path prefix in SSM to fetch parameters from (e.g., '/myapp/dev/')
   * @param recursive Whether to fetch parameters recursively
   */
  async fetchParametersAndCreateEnvFile(
    path: string,
    recursive: boolean = true,
  ): Promise<void> {
    try {
      
      const params = {
        Path: path,
        Recursive: recursive,
        WithDecryption: true, // Get decrypted SecureString values
      };

      let envVars = '';
      let nextToken: string | undefined;
      
      do {
        const command = new GetParametersByPathCommand({
          ...params,
          NextToken: nextToken,
        });
        
        const response = await this.ssmClient.send(command);
        nextToken = response.NextToken;
        
        if (response.Parameters && response.Parameters.length > 0) {
          for (const param of response.Parameters) {
            if (param.Name && param.Value) {
              // Extract the parameter name without the path prefix
              const paramName = param.Name.replace(path, '').replace(/\//g, '_');
              envVars += `${paramName}=${param.Value}\n`;
            }
          }
        }
      } while (nextToken);
      
      // Write parameters to .env file
      fs.writeFileSync('.env', envVars);
      
      // Reload environment variables
      dotenv.config();
    } catch (error) {
      console.error('Error fetching parameters from AWS SSM:', error);
      throw error;
    }
  }
} 