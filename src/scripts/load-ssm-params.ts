import { AwsParameterStore } from '../config/aws-ssm.config';
import * as dotenv from 'dotenv';

// Load any existing environment variables
dotenv.config();

async function loadSsmParams() {
  try {
    const env = process.env.NODE_ENV || 'development';
    const paramPath = process.env.SSM_PARAM_PATH || `/csat-dashboard/${env}/`;
    
    console.log(`Loading parameters from AWS SSM with path: ${paramPath}`);
    const parameterStore = new AwsParameterStore();
    
    await parameterStore.fetchParametersAndCreateEnvFile(paramPath);
    console.log('Parameters loaded successfully from AWS SSM');
  } catch (error) {
    console.error('Error loading parameters from AWS SSM:', error);
    process.exit(1);
  }
}

loadSsmParams(); 