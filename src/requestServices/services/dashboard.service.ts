import { Injectable, Inject } from '@nestjs/common';
import { ElasticService } from '../../ElasticSearch/elasticsearch.service';
import { Repository } from 'typeorm';
import { Vouchers } from '../../vochers/entities/vouchers.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    private readonly elasticSearchService: ElasticService,
    @Inject('DATA_SOURCE')
    private readonly dataSource: DataSource,
  ) {}

  async getDashboardStats() {
    try {
      const result = {
        lostChild: {
          activeLostChildCases: 0,
          activeFoundChildCases: 0
        },
        incidents: {
          openCases: 0,
          pendingInternalCases: 0
        },
        lostItem: {
          openCases: 0,
          inProgressCases: 0
        }
      };

      // Get all the counts in parallel for better performance
      const [
        lostChildResult, 
        foundChildResult, 
        incidentsOpenResult, 
        incidentsPendingResult,
        lostItemOpenResult,
        lostItemInProgressResult
      ] = await Promise.all([
        this.getActiveLostChildCount(),
        this.getActiveFoundChildCount(),
        this.getOpenIncidentsCount(),
        this.getPendingInternalIncidentsCount(),
        this.getOpenLostItemCount(),
        this.getInProgressLostItemCount()
      ]);

      result.lostChild.activeLostChildCases = lostChildResult;
      result.lostChild.activeFoundChildCases = foundChildResult;
      result.incidents.openCases = incidentsOpenResult;
      result.incidents.pendingInternalCases = incidentsPendingResult;
      result.lostItem.openCases = lostItemOpenResult;
      result.lostItem.inProgressCases = lostItemInProgressResult;

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error generating dashboard stats:', error);
      return {
        success: false,
        message: 'Error generating dashboard stats',
        error: error.message || error
      };
    }
  }

  private async getActiveLostChildCount(): Promise<number> {
    const query = {
      bool: {
        must: [
          { match: { 'type.keyword': 'Lost Child' } }
        ],
        must_not: [
          { match: { 'state.keyword': 'Closed' } }
        ]
      }
    };
    
    return await this.getCountFromElasticsearch(query);
  }

  private async getActiveFoundChildCount(): Promise<number> {
    const query = {
      bool: {
        must: [
          { match: { 'type.keyword': 'Found Child' } }
        ],
        must_not: [
          { match: { 'state.keyword': 'Closed' } }
        ]
      }
    };
    
    return await this.getCountFromElasticsearch(query);
  }

  private async getOpenIncidentsCount(): Promise<number> {
    const query = {
      bool: {
        must: [
          { match: { 'type.keyword': 'Incident Reporting' } },
          { match: { 'state.keyword': 'Open' } }
        ]
      }
    };
    
    return await this.getCountFromElasticsearch(query);
  }

  private async getPendingInternalIncidentsCount(): Promise<number> {
    const query = {
      bool: {
        must: [
          { match: { 'type.keyword': 'Incident Reporting' } },
          { match: { 'state.keyword': 'Pending Internal' } }
        ]
      }
    };
    
    return await this.getCountFromElasticsearch(query);
  }

  private async getOpenLostItemCount(): Promise<number> {
    const query = {
      bool: {
        must: [
          { match: { 'type.keyword': 'Lost Item' } },
          { match: { 'state.keyword': 'Open' } }
        ]
      }
    };
    
    return await this.getCountFromElasticsearch(query);
  }

  private async getInProgressLostItemCount(): Promise<number> {
    const query = {
      bool: {
        must: [
          { match: { 'type.keyword': 'Lost Item' } }
        ],
        must_not: [
          { match: { 'state.keyword': 'Open' } },
          { match: { 'state.keyword': 'Closed' } }
        ]
      }
    };
    
    return await this.getCountFromElasticsearch(query);
  } 
  
  private async getCountFromElasticsearch(query: any): Promise<number> {
    try {
      const result = await this.elasticSearchService.getSearchService().count({
        index: 'services',
        body: { query }
      });
      
      return result.body.count;
    } catch (error) {
      console.error('Error getting count from Elasticsearch:', error);
      return 0;
    }
  }

  async getDashboardService() {
    try {
      const result = {
        totalPickUpServices: 0,
        totalDeliveryServices: 0,
      };

      const [
        totalPickUpServicesResult,
        totalDeliveryServicesResult,
      ] = await Promise.all([
        this.getTotalPickUpServicesCount(),
        this.getTotalDeliveryServicesCount()
      ]);

      result.totalPickUpServices = totalPickUpServicesResult;
      result.totalDeliveryServices = totalDeliveryServicesResult;

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error generating dashboard service:', error);
      return {  
        success: false,
        message: 'Error generating dashboard service',
        error: error.message || error
      };
    }
  }

  private async getTotalPickUpServicesCount(): Promise<number> {
    const query = {
      bool: {
        must: [
          { match: { 'metadata.pickUp': true } }
        ]   
      }
    };

    return await this.getCountFromElasticsearch(query);
  }

  private async getTotalDeliveryServicesCount(): Promise<number> {
    const query = {
      bool: {
        must: [
          { match: { 'metadata.delivery': true } }
        ]   
      }
    };

    return await this.getCountFromElasticsearch(query);
  }

  async getDashboardVouchers() {
    try {
      const result = {
        totalVouchersInStock: 0,
        totalVouchersSoldedToday: 0
      };

      const [
        totalVouchersInStock,
        totalVouchersSoldedToday
      ] = await Promise.all([
        this.getTotalVouchersInStock(),
        this.getTotalVouchersSoldedToday()
      ]);   
  
      result.totalVouchersInStock = totalVouchersInStock;
      result.totalVouchersSoldedToday = totalVouchersSoldedToday;

      return {
        success: true,
        data: result
      };    
    } catch (error) {
      console.error('Error generating dashboard vouchers:', error);
      return {
        success: false,
        message: 'Error generating dashboard vouchers',
        error: error.message || error
      };
    }
  }

  private async getTotalVouchersInStock(): Promise<number> {
    try {
      const vouchersRepository = this.dataSource.getRepository(Vouchers);
      const vouchersInStock = await vouchersRepository
        .createQueryBuilder('vouchers')
        .where('vouchers.state NOT IN (:...states)', { states: ['Sold', 'Refunded'] })
        .getCount();
        
      return vouchersInStock;
    } catch (error) {
      console.error('Error getting vouchers in stock:', error);
      return 0;
    }
  }

  private async getTotalVouchersSoldedToday(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const vouchersRepository = this.dataSource.getRepository(Vouchers);
      const result = await vouchersRepository.query(`
        SELECT COUNT(*) as count
        FROM vouchers
        WHERE state = 'Sold'
        AND metadata->>'date_sale' IS NOT NULL
        AND (metadata->>'date_sale')::timestamp >= $1
        AND (metadata->>'date_sale')::timestamp < $2
      `, [today.toISOString(), tomorrow.toISOString()]);
      
      console.log('Vouchers sold today query result:', result);
      
      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      console.error('Error getting vouchers sold today:', error);
      return 0;
    }
  }

  async getDashboardFeedback() {
    try {
      const result = {
        totalComments: 0,
        totalSuggestions: 0,
        totalComplaints: 0
      };

      const [
        totalComments,
        totalSuggestions,
        totalComplaints
      ] = await Promise.all([
        this.getTotalComments(),
        this.getTotalSuggestions(),
        this.getTotalComplaints()
      ]);

      result.totalComments = totalComments;
      result.totalSuggestions = totalSuggestions;
      result.totalComplaints = totalComplaints;

      return {
        success: true,
        data: result
      };    
    } catch (error) {
      console.error('Error generating dashboard feedback:', error);
      return {
        success: false,
        message: 'Error generating dashboard feedback',
        error: error.message || error
      };    
    }
  }

  private async getTotalComments(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const result = await this.dataSource.query(`
        SELECT COUNT(*) as count
        FROM comments
        WHERE status = 'Open'
        AND created_at >= $1
        AND created_at < $2
      `, [today.toISOString(), tomorrow.toISOString()]);
      
      console.log('Comments query result:', result);
      
      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      console.error('Error getting comments:', error);
      return 0;
    }
  }

  private async getTotalSuggestions(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const query = {
      bool: {
        must: [
          { match: { 'name.keyword': 'Suggestion Box' } },
          { match: { 'state.keyword': 'Pending' } },
          {
            range: {
              createdAt: {
                gte: today.toISOString(),
                lt: tomorrow.toISOString()
              }
            }
          }
        ]   
      }
    };
  
    return await this.getCountFromElasticsearch(query);
  }

  private async getTotalComplaints(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);   
      
      const query = {
        bool: {
          should: [
            { match: { 'status.keyword': 'Open' } },
            { match: { 'status.keyword': 'Pending (First Level)' } },
            { match: { 'status.keyword': 'Pending Review (Final Level)' } },
            { match: { 'status.keyword': 'Pending (CX Team)' } },
            { match: { 'status.keyword': 'Re-sent' } }
          ],
          must: [
            {
              range: {
                createdAt: {
                  gte: today.toISOString(),
                  lt: tomorrow.toISOString()
                }
              }
            }
          ]
        }
      };  

      return await this.getCountFromElasticsearchComplaints(query);
    } catch (error) {
      console.error('Error getting complaints:', error);
      return 0;
    }
  }
  
  private async getCountFromElasticsearchComplaints(query: any): Promise<number> {
    try {
      const result = await this.elasticSearchService.getSearchService().count({
        index: 'complaints',
        body: { query }
      });
      
      return result.body.count;
    } catch (error) {
      console.error('Error getting count from Elasticsearch:', error);
      return 0;
    }
  }
} 