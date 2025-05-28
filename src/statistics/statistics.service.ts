import { Injectable, Logger, Inject } from '@nestjs/common';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
import * as moment from 'moment';
import { DashboardStatisticsDto } from './dto/dashboard-statistics.dto';
import { Repository } from 'typeorm';
import { Vouchers } from 'vochers/entities/vouchers.entity';
import { Complaints } from 'complaint/entities/complaint.entity';
import { Comment } from 'comment/entities/comment.entity';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    private readonly elasticService: ElasticService,
    @Inject('VOUCHERS_REPOSITORY')
    private readonly vouchersRepository: Repository<Vouchers>,
    @Inject('COMPLAINT_SERVICES_REPOSITORY')
    private readonly complaintsRepository: Repository<Complaints>,
    @Inject('COMMENT_REPOSITORY')
    private readonly commentsRepository: Repository<Comment>,
  ) {}

  /**
   * Get dashboard statistics for all services
   * @returns Dashboard statistics for all required services
   */
  async getDashboardStatistics(): Promise<DashboardStatisticsDto> {
    const today = moment().startOf('day');
    const todayStr = today.format('YYYY-MM-DD');
    
    // Get statistics for each category - wrapping each in try/catch to prevent one failure from affecting others
    const [
      lostChildStats,
      incidentStats,
      lostFoundStats,
      servicesStats,
      voucherStats,
      feedbackStats
    ] = await Promise.all([
      this.getSafeStatistics(() => this.getLostChildStatistics()),
      this.getSafeStatistics(() => this.getIncidentStatistics()),
      this.getSafeStatistics(() => this.getLostFoundStatistics()),
      this.getSafeStatistics(() => this.getServicesStatistics()),
      this.getSafeStatistics(() => this.getVoucherStatistics(todayStr)),
      this.getSafeStatistics(() => this.getFeedbackStatistics())
    ]);

    return {
      lostChildStats,
      incidentStats,
      lostFoundStats,
      servicesStats,
      voucherStats,
      feedbackStats
    };
  }

  /**
   * Safely execute a statistics function and return default values if it fails
   * @param fn The statistics function to execute
   * @returns The statistics or default values if an error occurs
   */
  private async getSafeStatistics<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.logger.error(`Error fetching statistics: ${error.message}`, error.stack);
      return {} as T;
    }
  }

  /**
   * Get statistics for Lost Child services
   * @returns Count of active Open and Child Found cases
   */
  private async getLostChildStatistics() {
    // Count Open Lost Child cases
    const openCasesResult = await this.elasticService.searchByQuery('services', {
      query: {
        bool: {
          must: [
            { match: { 'type.keyword': 'Lost Child' } },
            { match: { 'state.keyword': 'Open' } }
          ]
        }
      }
    });

    // Count Child Found cases
    const foundCasesResult = await this.elasticService.searchByQuery('services', {
      query: {
        bool: {
          must: [
            { match: { 'type.keyword': 'Lost Child' } },
            { match: { 'state.keyword': 'Child Found' } }
          ]
        }
      }
    });

    return {
      openCasesCount: openCasesResult.totalHits || 0,
      childFoundCasesCount: foundCasesResult.totalHits || 0
    };
  }

  /**
   * Get statistics for Incident reports
   * @returns Count of Open and Pending Internal cases
   */
  private async getIncidentStatistics() {
    // Count Open Incident cases
    const openCasesResult = await this.elasticService.searchByQuery('services', {
      query: {
        bool: {
          must: [
            { match: { 'type.keyword': 'Incident Reporting' } },
            { match: { 'state.keyword': 'Open' } }
          ]
        }
      }
    });

    // Count Pending Internal Incident cases
    const pendingInternalResult = await this.elasticService.searchByQuery('services', {
      query: {
        bool: {
          must: [
            { match: { 'type.keyword': 'Incident Reporting' } },
            { match: { 'state.keyword': 'Pending Internal' } }
          ]
        }
      }
    });

    return {
      openCasesCount: openCasesResult.totalHits || 0,
      pendingInternalCasesCount: pendingInternalResult.totalHits || 0
    };
  }

  /**
   * Get statistics for Lost & Found items
   * @returns Count of open cases and in progress cases
   */
  private async getLostFoundStatistics() {
    // Count open Lost & Found cases not in Article Found or Article Not Found state
    const openCasesResult = await this.elasticService.searchByQuery('services', {
      query: {
        bool: {
          must: [
            { match: { 'type.keyword': 'Lost Item' } }
          ],
          must_not: [
            { match: { 'state.keyword': 'Article Found' } },
            { match: { 'state.keyword': 'Article Not Found' } }
          ]
        }
      }
    });

    // Count In Progress Lost & Found cases
    const inProgressResult = await this.elasticService.searchByQuery('services', {
      query: {
        bool: {
          must: [
            { match: { 'type.keyword': 'Lost Item' } },
            { match: { 'state.keyword': 'In Progress' } }
          ]
        }
      }
    });

    return {
      openCasesCount: openCasesResult.totalHits || 0,
      inProgressCasesCount: inProgressResult.totalHits || 0
    };
  }

  /**
   * Get statistics for services (delivery and pickup requests)
   * @returns Count of delivery and pickup requests
   */
  private async getServicesStatistics() {
    // Count services with delivery requests
    const deliveryRequestsResult = await this.elasticService.searchByQuery('services', {
      query: {
        bool: {
          must: [
            { match: { 'metadata.delivery': true } }
          ]
        }
      }
    });

    // Count services with pickup requests
    const pickupRequestsResult = await this.elasticService.searchByQuery('services', {
      query: {
        bool: {
          must: [
            { match: { 'metadata.pickUp': true } }
          ]
        }
      }
    });

    return {
      deliveryRequestsCount: deliveryRequestsResult.totalHits || 0,
      pickupRequestsCount: pickupRequestsResult.totalHits || 0
    };
  }

  /**
   * Get statistics for vouchers directly from the database
   * @param todayDate Today's date in YYYY-MM-DD format
   * @returns Count of in-stock vouchers and vouchers sold today
   */
  private async getVoucherStatistics(todayDate: string) {
    try {
      // Count in-stock vouchers (not Sold, Extended, or Refunded)
      const inStockCount = await this.vouchersRepository
        .createQueryBuilder('vouchers')
        .where('vouchers.state NOT IN (:...statuses)', { 
          statuses: ['Sold', 'Extended', 'Refunded'] 
        })
        .getCount();

      // Create date range for today
      const startOfToday = new Date(`${todayDate}T00:00:00.000Z`);
      const endOfToday = new Date(`${todayDate}T23:59:59.999Z`);

      // Count vouchers sold today by checking the date_sale in metadata
      const soldTodayCount = await this.vouchersRepository
        .createQueryBuilder('vouchers')
        .where('vouchers.state = :state', { state: 'Sold' })
        .andWhere(`CAST(vouchers.metadata->>'date_sale' AS TIMESTAMP) >= :startDate`, { 
          startDate: startOfToday 
        })
        .andWhere(`CAST(vouchers.metadata->>'date_sale' AS TIMESTAMP) <= :endDate`, { 
          endDate: endOfToday 
        })
        .getCount();

      return {
        inStockCount,
        soldTodayCount
      };
    } catch (error) {
      this.logger.error(`Error fetching voucher statistics from database: ${error.message}`, error.stack);
      return {
        inStockCount: 0,
        soldTodayCount: 0
      };
    }
  }

  /**
   * Check if an Elasticsearch index exists
   * @param indexName The name of the index to check
   * @returns True if the index exists, false otherwise
   */
  private async checkIndexExists(indexName: string): Promise<boolean> {
    try {
      const result = await this.elasticService.getSearchService().indices.exists({
        index: indexName
      });
      return result.body;
    } catch (error) {
      this.logger.error(`Error checking if index exists: ${error.message}`);
      return false;
    }
  }

  /**
   * Get statistics for feedback (comments, suggestions, complaints) from the database
   * @returns Count of open comments, pending internal suggestions, and open/pending complaints
   */
  private async getFeedbackStatistics() {
    try {
      // Count comments with Open status
      const openCommentsCount = await this.commentsRepository
        .createQueryBuilder('comments')
        .where('comments.status = :status', { status: 'Open' })
        .getCount();

      // Count suggestions with Pending Internal status

        const pendingSuggestionsResult = await this.elasticService.searchByQuery('services', {
            query: {
              bool: {
                must: [
                  { match: { 'type.keyword': 'Suggestion Box' } },
                  { match: { 'state.keyword': 'Pending' } }
                ]
              }
            }
          });
      
          const pendingSuggestionsCount = pendingSuggestionsResult.totalHits || 0;

      // Count complaints with Open or Pending (CX Team) status
        const openPendingComplaintsCount = await this.complaintsRepository
        .createQueryBuilder('complaints')
        .where('complaints.status IN (:...status)', { 
          status: ['Open', 'Pending (CX Team)'] 
        })
        .getCount();

      return {
        openCommentsCount,
        pendingSuggestionsCount,
        openPendingComplaintsCount
      };
    } catch (error) {
      this.logger.error(`Error fetching feedback statistics from database: ${error.message}`, error.stack);
      return {
        openCommentsCount: 0,
        pendingSuggestionsCount: 0,
        openPendingComplaintsCount: 0
      };
    }
  }
} 