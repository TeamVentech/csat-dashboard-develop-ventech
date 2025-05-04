import { Injectable } from '@nestjs/common';
import { ElasticService } from '../../ElasticSearch/elasticsearch.service';
import { PeriodType, TransactionReportDto } from '../dto/transaction-report.dto';
import * as moment from 'moment';

// Touchpoint interface for reports
export interface Touchpoint {
  id: string;
  name: string;
  count: number;
}

@Injectable()
export class TransactionReportService {
  constructor(private readonly elasticService: ElasticService) {}

  async getTransactionReport(filters: TransactionReportDto) {
    try {
      // Build Elasticsearch query
      const query = this.buildSearchQuery(filters);
            
      // Execute search
      const result = await this.elasticService.searchByQuery(
        'survey_transactions',
        { query, size: 10000 }, // Use large size to get all matching documents
        1, 
        10000
      );


      if (!result || !result.results || result.results.length === 0) {
        return {
          periods: [],
          totalCount: 0
        };
      }

      // Process results based on the selected period
      const reportData = this.processReportData(result.results, filters.period);
      
      return {
        periods: reportData,
        totalCount: result.results.length
      };
    } catch (error) {
      console.error('Error generating transaction report:', error);
      throw error;
    }
  }

  async getRatingsReport(filters: TransactionReportDto) {
    try {
      // Build Elasticsearch query
      const query = this.buildSearchQuery(filters);
      
      // Execute search
      const result = await this.elasticService.searchByQuery(
        'survey_transactions',
        { query, size: 10000 }, // Use large size to get all matching documents
        1, 
        10000
      );

      if (!result || !result.results || result.results.length === 0) {
        return {
          periods: [],
          totalCount: 0
        };
      }

      // Process results based on the selected period
      const reportData = this.processRatingsData(result.results, filters.period);
      
      return {
        periods: reportData.periods,
        totalCount: result.results.length
      };
    } catch (error) {
      console.error('Error generating ratings report:', error);
      throw error;
    }
  }

  async getMostCommonTouchpoints(filters: TransactionReportDto) {
    try {
      // Build Elasticsearch query
      const query = this.buildSearchQuery(filters);
      
      // Execute search
      const result = await this.elasticService.searchByQuery(
        'survey_transactions',
        { query, size: 10000 }, // Use large size to get all matching documents
        1, 
        10000
      );

      if (!result || !result.results || result.results.length === 0) {
        return {
          periods: [],
          totalCount: 0
        };
      }

      // Process results based on the selected period
      const periodsData = this.processTouchpointsDataByPeriod(result.results, filters.period);
      
      return {
        periods: periodsData,
        totalCount: result.results.length
      };
    } catch (error) {
      console.error('Error generating touchpoints report:', error);
      throw error;
    }
  }

  /**
   * Get top 10 touchpoints with highest poor or high ratings
   * Poor rating: 0.4 or less, High rating: 0.41 or more
   */
  async getTouchpointRatings(filters: TransactionReportDto) {
    try {
      // Build Elasticsearch query
      const query = this.buildSearchQuery(filters);
      
      // Execute search
      const result = await this.elasticService.searchByQuery(
        'survey_transactions',
        { query, size: 10000 }, // Use large size to get all matching documents
        1, 
        10000
      );

      if (!result || !result.results || result.results.length === 0) {
        return {
          poorRatings: [],
          highRatings: [],
          totalCount: 0
        };
      }

      // Process touchpoint ratings data
      const touchpointRatings = this.processTouchpointRatingsData(result.results);
      
      return {
        poorRatings: touchpointRatings.poorRatings,
        highRatings: touchpointRatings.highRatings,
        totalCount: result.results.length
      };
    } catch (error) {
      console.error('Error generating touchpoint ratings report:', error);
      throw error;
    }
  }

  /**
   * Process touchpoint ratings data to get top 10 touchpoints with poor and high ratings
   */
  private processTouchpointRatingsData(data: any[]) {
    // Map to store touchpoint rating data
    const touchpointMap = new Map<string, {
      id: string;
      name: string;
      totalRating: number;
      count: number;
      avgRating: number;
      poorCount: number;
      highCount: number;
      poorPercentage: number;
      highPercentage: number;
    }>();
    
    // Process each transaction
    data.forEach(item => {
      if (!item.createdAt || !item.touchpointId) return;
      
      // Extract touchpoint information
      const touchpointId = item.touchpointId;
      const touchpointName = item.touchpoint?.name?.en || 'Unknown Touchpoint';
      
      // Skip if we don't have meaningful information
      if (!touchpointId) {
        return;
      }
      
      // Calculate rating value
      let rating = 0;
      if (item.rating) {
        rating = parseFloat(item.rating);
      } else if (item.answers && item.answers.length > 0) {
        // If no overall rating, calculate from multiple choice answers
        const multipleChoiceAnswers = item.answers.filter(a => a.type === 'multiple');
        if (multipleChoiceAnswers.length > 0) {
          const totalRating = multipleChoiceAnswers.reduce((sum, answer) => {
            return sum + (Number(answer.answer) / 5); // Convert 1-5 to 0.0-1.0
          }, 0);
          rating = totalRating / multipleChoiceAnswers.length;
        }
      }
      
      // Whether this rating is considered poor or high
      const isPoorRating = rating <= 0.4;
      const isHighRating = rating > 0.4;
      
      // Get or create touchpoint data
      if (!touchpointMap.has(touchpointId)) {
        touchpointMap.set(touchpointId, {
          id: touchpointId,
          name: touchpointName,
          totalRating: 0,
          count: 0,
          avgRating: 0,
          poorCount: 0,
          highCount: 0,
          poorPercentage: 0,
          highPercentage: 0
        });
      }
      
      // Update touchpoint data
      const touchpointData = touchpointMap.get(touchpointId);
      touchpointData.totalRating += rating;
      touchpointData.count += 1;
      
      if (isPoorRating) {
        touchpointData.poorCount += 1;
      }
      
      if (isHighRating) {
        touchpointData.highCount += 1;
      }
    });
    
    // Calculate averages and percentages
    for (const [_, touchpointData] of touchpointMap.entries()) {
      if (touchpointData.count > 0) {
        touchpointData.avgRating = touchpointData.totalRating / touchpointData.count;
        touchpointData.poorPercentage = (touchpointData.poorCount / touchpointData.count) * 100;
        touchpointData.highPercentage = (touchpointData.highCount / touchpointData.count) * 100;
      }
    }
    
    // Convert map to array and sort for top 10
    const touchpointArray = Array.from(touchpointMap.values());
    
    // Get top 10 touchpoints with poor ratings
    const topPoorRatings = touchpointArray
      .filter(tp => tp.poorCount > 0)
      .sort((a, b) => b.poorPercentage - a.poorPercentage || b.poorCount - a.poorCount)
      .slice(0, 10)
      .map(tp => ({
        id: tp.id,
        name: tp.name,
        avgRating: (tp.avgRating * 5).toFixed(2), // Convert back to 0-5 scale
        count: tp.count,
        poorCount: tp.poorCount,
        poorPercentage: tp.poorPercentage.toFixed(2)
      }));
    
    // Get top 10 touchpoints with high ratings
    const topHighRatings = touchpointArray
      .filter(tp => tp.highCount > 0)
      .sort((a, b) => b.highPercentage - a.highPercentage || b.highCount - a.highCount)
      .slice(0, 10)
      .map(tp => ({
        id: tp.id,
        name: tp.name,
        avgRating: (tp.avgRating * 5).toFixed(2), // Convert back to 0-5 scale
        count: tp.count,
        highCount: tp.highCount,
        highPercentage: tp.highPercentage.toFixed(2)
      }));
    
    return {
      poorRatings: topPoorRatings,
      highRatings: topHighRatings
    };
  }

  /**
   * Get ratings per question data for tabular reports
   */
  async getQuestionRatings(filters: TransactionReportDto) {
    try {
      // Build Elasticsearch query
      const query = this.buildSearchQuery(filters);
      // Execute search
      const result = await this.elasticService.searchByQuery(
        'survey_transactions',
        { query, size: 10000 }, // Use large size to get all matching documents
        1, 
        10000
      );

      if (!result || !result.results || result.results.length === 0) {
        return {
          periods: [],
          questions: [],
          totalCount: 0
        };
      }

      // Process question ratings data based on the period
      const reportData = this.processQuestionRatingsData(result.results, filters.period);
      
      return {
        periods: reportData.periods,
        questions: reportData.questions,
        totalCount: result.results.length
      };
    } catch (error) {
      console.error('Error generating question ratings report:', error);
      throw error;
    }
  }

  /**
   * Process question ratings data based on period
   */
  private processQuestionRatingsData(data: any[], periodType: PeriodType) {
    // Extract all questions from the data
    const questions = this.extractDetailedQuestions(data, periodType);
    
    // Process data by period
    let periods;
    switch (periodType) {
      case PeriodType.DAILY:
        periods = this.processQuestionRatingsByDay(data, questions);
        break;
      case PeriodType.WEEKLY:
        periods = this.processQuestionRatingsByWeek(data, questions);
        break;
      case PeriodType.MONTHLY:
        periods = this.processQuestionRatingsByMonth(data, questions);
        break;
      case PeriodType.HOURLY:
        periods = this.processQuestionRatingsByHour(data, questions);
        break;
      default:
        periods = this.processQuestionRatingsByDay(data, questions);
    }
    
    return {
      periods,
      questions
    };
  }
  
  /**
   * Extract detailed question information from the survey data
   */
  private extractDetailedQuestions(data: any[], periodType: PeriodType) {
    const questionsMap = new Map();
    
    data.forEach(transaction => {
      if (!transaction.survey?.metadata?.questions) return;
      
      // Get all multiple choice questions from the survey
      const multipleChoiceQuestions = transaction.survey.metadata.questions.filter(
        q => q.type === 'multiple'
      );
      
      multipleChoiceQuestions.forEach(question => {
        const questionId = question.id;
        if (!questionsMap.has(questionId)) {
          questionsMap.set(questionId, {
            id: questionId,
            text: question.question?.en || 'Unknown Question',
            surveyId: transaction.surveyId,
            surveyName: transaction.survey?.name || 'Unknown Survey',
            totalCount: 0,
            ratingCounts: [0, 0, 0, 0, 0], // Count of 1-5 ratings
            totalRating: 0,
            averageRating: 0
          });
        }
      });
    });
    
    return Array.from(questionsMap.values());
  }
  
  /**
   * Process question ratings by day
   */
  private processQuestionRatingsByDay(data: any[], questions: any[]) {
    // Create a map of question IDs for quick lookup
    const questionsMap = new Map();
    questions.forEach(question => {
      questionsMap.set(question.id, question);
    });

    // Find date range
    let minDate = null;
    let maxDate = null;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!minDate || date < minDate) minDate = new Date(date);
        if (!maxDate || date > maxDate) maxDate = new Date(date);
      }
    });
    
    if (!minDate || !maxDate) {
      return [];
    }
    
    // Create map of all days in the range
    const dayMap = new Map();
    const utcMinDate = new Date(minDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
    const utcMaxDate = new Date(maxDate.toISOString().split('T')[0] + 'T23:59:59.999Z');
    
    const currentDate = new Date(utcMinDate);
    
    // Initialize data structure for each day
    while (currentDate <= utcMaxDate) {
      const dayKey = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const dayData = {
        period: dayKey,
        questionRatings: {}
      };
      
      // Initialize ratings data for each question
      questions.forEach(question => {
        dayData.questionRatings[question.id] = {
          id: question.id,
          text: question.text,
          count: 0,
          ratingCounts: [0, 0, 0, 0, 0], // Count of 1-5 ratings
          totalRating: 0,
          averageRating: 0
        };
      });
      
      dayMap.set(dayKey, dayData);
      
      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    // Process each transaction
    data.forEach(transaction => {
      if (!transaction.createdAt || !transaction.answers) return;
      
      const date = new Date(transaction.createdAt);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!dayMap.has(dayKey)) return;
      
      const dayData = dayMap.get(dayKey);
      
      // Process multiple choice answers
      const multipleChoiceAnswers = transaction.answers.filter(a => a.type === 'multiple');
      
      multipleChoiceAnswers.forEach(answer => {
        const questionId = answer.id;
        if (dayData.questionRatings[questionId]) {
          const rating = parseInt(answer.answer);
          if (rating >= 1 && rating <= 5) {
            dayData.questionRatings[questionId].count++;
            dayData.questionRatings[questionId].ratingCounts[rating - 1]++;
            dayData.questionRatings[questionId].totalRating += rating;
          }
        }
      });
    });
    
    // Calculate averages for each day and question
    for (const [_, dayData] of dayMap.entries()) {
      for (const questionId in dayData.questionRatings) {
        const qData = dayData.questionRatings[questionId];
        if (qData.count > 0) {
          qData.averageRating = qData.totalRating / qData.count;
        }
      }
    }
    
    // Convert map to array and format for response
    return Array.from(dayMap.entries()).map(([period, data]) => {
      return {
        period,
        questionRatings: Object.values(data.questionRatings)
      };
    });
  }
  
  /**
   * Process question ratings by week
   */
  private processQuestionRatingsByWeek(data: any[], questions: any[]) {
    // Create a map of question IDs for quick lookup
    const questionsMap = new Map();
    questions.forEach(question => {
      questionsMap.set(question.id, question);
    });

    // Find date range
    let minDate = null;
    let maxDate = null;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!minDate || date < minDate) minDate = new Date(date);
        if (!maxDate || date > maxDate) maxDate = new Date(date);
      }
    });
    
    if (!minDate || !maxDate) {
      return [];
    }
    
    // Generate week ranges
    const weekMap = new Map();
    const startWeek = moment.utc(minDate).startOf('week');
    const endWeek = moment.utc(maxDate).endOf('week');
    
    let currentWeek = startWeek.clone();
    while (currentWeek.isSameOrBefore(endWeek)) {
      const weekStart = currentWeek.clone();
      const weekEnd = currentWeek.clone().endOf('week');
      
      // Format as "Apr 04-27 to Apr 05-03"
      const weekKey = `${weekStart.format('MMM')} ${weekStart.format('MM')}-${weekStart.format('DD')} to ${weekEnd.format('MMM')} ${weekEnd.format('MM')}-${weekEnd.format('DD')}`;
      
      const weekData = {
        period: weekKey,
        start: weekStart.toDate(),
        end: weekEnd.toDate(),
        questionRatings: {}
      };
      
      // Initialize ratings data for each question
      questions.forEach(question => {
        weekData.questionRatings[question.id] = {
          id: question.id,
          text: question.text,
          count: 0,
          ratingCounts: [0, 0, 0, 0, 0], // Count of 1-5 ratings
          totalRating: 0,
          averageRating: 0
        };
      });
      
      weekMap.set(weekKey, weekData);
      
      currentWeek.add(1, 'week');
    }
    
    // Process each transaction
    data.forEach(transaction => {
      if (!transaction.createdAt || !transaction.answers) return;
      
      const date = moment.utc(transaction.createdAt).toDate();
      
      // Find the corresponding week
      let weekData = null;
      
      for (const [_, week] of weekMap.entries()) {
        if (date >= week.start && date <= week.end) {
          weekData = week;
          break;
        }
      }
      
      if (!weekData) return;
      
          // Process multiple choice answers
          const multipleChoiceAnswers = transaction.answers.filter(a => a.type === 'multiple');
          
          multipleChoiceAnswers.forEach(answer => {
        const questionId = answer.id;
        if (weekData.questionRatings[questionId]) {
          const rating = parseInt(answer.answer);
          if (rating >= 1 && rating <= 5) {
            weekData.questionRatings[questionId].count++;
            weekData.questionRatings[questionId].ratingCounts[rating - 1]++;
            weekData.questionRatings[questionId].totalRating += rating;
          }
        }
      });
    });
    
    // Calculate averages for each week and question
    for (const [_, weekData] of weekMap.entries()) {
      for (const questionId in weekData.questionRatings) {
        const qData = weekData.questionRatings[questionId];
        if (qData.count > 0) {
          qData.averageRating = qData.totalRating / qData.count;
        }
      }
    }
    
    // Convert map to array and format for response
    return Array.from(weekMap.entries()).map(([period, data]) => {
      return {
        period,
        questionRatings: Object.values(data.questionRatings)
      };
    });
  }
  
  /**
   * Process question ratings by month
   */
  private processQuestionRatingsByMonth(data: any[], questions: any[]) {
    // Create a map of question IDs for quick lookup
    const questionsMap = new Map();
    questions.forEach(question => {
      questionsMap.set(question.id, question);
    });

    // Find date range
    let minDate = null;
    let maxDate = null;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!minDate || date < minDate) minDate = new Date(date);
        if (!maxDate || date > maxDate) maxDate = new Date(date);
      }
    });
    
    if (!minDate || !maxDate) {
      return [];
    }
    
    // Create map of all months in the range
    const monthMap = new Map();
    const startMonth = new Date(Date.UTC(minDate.getUTCFullYear(), minDate.getUTCMonth(), 1));
    const endMonth = new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), 1));
    
    let currentMonth = new Date(startMonth);
    while (currentMonth <= endMonth) {
      const year = currentMonth.getUTCFullYear();
      const month = currentMonth.getUTCMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthName = new Date(Date.UTC(year, month, 1)).toLocaleString('default', { month: 'long', year: 'numeric' });
      
      const monthData = {
        period: monthName,
        questionRatings: {}
      };
      
      // Initialize ratings data for each question
      questions.forEach(question => {
        monthData.questionRatings[question.id] = {
          id: question.id,
          text: question.text,
          count: 0,
          ratingCounts: [0, 0, 0, 0, 0], // Count of 1-5 ratings
          totalRating: 0,
          averageRating: 0
        };
      });
      
      monthMap.set(monthKey, monthData);
      
      // Move to next month
      currentMonth.setUTCMonth(currentMonth.getUTCMonth() + 1);
    }
    
    // Process each transaction
    data.forEach(transaction => {
      if (!transaction.createdAt || !transaction.answers) return;
      
      const date = new Date(transaction.createdAt);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      if (!monthMap.has(monthKey)) return;
      
      const monthData = monthMap.get(monthKey);
      
      // Process multiple choice answers
      const multipleChoiceAnswers = transaction.answers.filter(a => a.type === 'multiple');
      
      multipleChoiceAnswers.forEach(answer => {
        const questionId = answer.id;
        if (monthData.questionRatings[questionId]) {
          const rating = parseInt(answer.answer);
          if (rating >= 1 && rating <= 5) {
            monthData.questionRatings[questionId].count++;
            monthData.questionRatings[questionId].ratingCounts[rating - 1]++;
            monthData.questionRatings[questionId].totalRating += rating;
          }
        }
      });
    });
    
    // Calculate averages for each month and question
    for (const [_, monthData] of monthMap.entries()) {
      for (const questionId in monthData.questionRatings) {
        const qData = monthData.questionRatings[questionId];
        if (qData.count > 0) {
          qData.averageRating = qData.totalRating / qData.count;
        }
      }
    }
    
    // Convert map to array and format for response
    return Array.from(monthMap.entries()).map(([key, data]) => {
      return {
        period: data.period,
        questionRatings: Object.values(data.questionRatings)
      };
    });
  }
  
  /**
   * Process question ratings by hour
   */
  private processQuestionRatingsByHour(data: any[], questions: any[]) {
    // Create a map of question IDs for quick lookup
    const questionsMap = new Map();
    questions.forEach(question => {
      questionsMap.set(question.id, question);
    });

    // Initialize data structure for each hour (0-23)
    const hourMap = new Map();
    
    for (let hour = 0; hour < 24; hour++) {
      // Format as "01:00 AM", "02:00 PM", etc.
      const period = `${String(hour % 12 || 12).padStart(2, '0')}:00 ${hour < 12 ? 'AM' : 'PM'}`;
      
      hourMap.set(hour, {
        period,
        touchpoints: new Map<string, Touchpoint>()
      });
    }
    
    // Process each transaction
    data.forEach(item => {
      try {
        if (!item.createdAt) return;
      
        // Get the hour for this transaction
        const date = new Date(item.createdAt);
      const hour = date.getUTCHours();
      
      const hourData = hourMap.get(hour);
      
        // Extract touchpoint information
        let touchpointId = 'unknown';
        let touchpointName = 'Unknown Touchpoint';
        
        if (item.touchpointId) {
          touchpointId = item.touchpointId;
        }
        
        if (item.touchpoint && item.touchpoint.name) {
          if (typeof item.touchpoint.name === 'string') {
            touchpointName = item.touchpoint.name;
          } else if (item.touchpoint.name.en) {
            touchpointName = item.touchpoint.name.en;
          } else if (item.touchpoint.name.ar) {
            touchpointName = item.touchpoint.name.ar;
          }
        } else if (item.touchpoint && typeof item.touchpoint === 'string') {
          touchpointName = item.touchpoint;
        } else if (item.touchpointName) {
          touchpointName = item.touchpointName;
        }
        
        // Skip if we don't have meaningful information
        if (touchpointId === 'unknown' && touchpointName === 'Unknown Touchpoint') {
          return;
        }
        
        const touchpointKey = `${touchpointId}|${touchpointName}`;
        
        // Add or update touchpoint count for this hour
        if (!hourData.touchpoints.has(touchpointKey)) {
          hourData.touchpoints.set(touchpointKey, { 
            id: touchpointId, 
            name: touchpointName, 
            count: 0 
          });
        }
        
        hourData.touchpoints.get(touchpointKey)!.count += 1;
      } catch (error) {
        console.error('Error processing touchpoint item for hour:', error);
      }
    });
    
    // Convert map to array and format for response
    return Array.from(hourMap.entries())
      .sort((a, b) => a[0] - b[0])  // Sort by hour
      .map(([hour, data]) => {
        // Sort touchpoints by count for each hour and convert to array
        const touchpoints = Array.from(data.touchpoints.values() as IterableIterator<Touchpoint>)
          .sort((a, b) => b.count - a.count);
        
        return {
          period: data.period,
          touchpoints
        };
      });
  }

  private buildSearchQuery(filters: TransactionReportDto) {
    const must = [];

    if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { 'createdAt': {} } };
        if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
        if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
        must.push(dateRange);
      }

    // Filter by survey
    if (filters.surveyId) {
      must.push({ match: { "surveyId.keyword": filters.surveyId } });
    }

    // Filter by category
    if (filters.categoryId) {
      must.push({ match: { "categoryId.keyword": filters.categoryId } });
    }

    // Filter by touchpoint
    if (filters.touchpointId) {
      must.push({ match: { "touchpointId.keyword": filters.touchpointId } });
    }

    // Filter by customer gender
    if (filters.gender) {
      must.push({ match: { 'customer.gender.keyword': filters.gender } });
    }

    if (filters.questionsSection) {
      // Try a simple term match since nested query doesn't work
      if (filters.questionsSection.length === 36) {
        // If it looks like a UUID, search by ID directly
        must.push({ 
          match: {
            "survey.metadata.questions.selectedOptions.id": filters.questionsSection
          }
        });
      } else {
        // Otherwise search by name
        must.push({ 
          match_phrase: {
            "survey.metadata.questions.selectedOptions.name": filters.questionsSection
          }
        });
      }
    }

    // Filter by customer age range
    if (filters.minAge || filters.maxAge) {
      const ageRangeFilter: any = {
        range: {
          'customer.age': {}
        }
      };

      if (filters.minAge) {
        ageRangeFilter.range['customer.age'].gte = filters.minAge;
      }

      if (filters.maxAge) {
        ageRangeFilter.range['customer.age'].lte = filters.maxAge;
      }

      must.push(ageRangeFilter);
        }
        
        return {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }]
      }
    };
  }

  private processReportData(data: any[], periodType: PeriodType) {
    switch (periodType) {
      case PeriodType.DAILY:
        return this.processDailyData(data);
      case PeriodType.WEEKLY:
        return this.processWeeklyData(data);
      case PeriodType.MONTHLY:
        return this.processMonthlyData(data);
      case PeriodType.HOURLY:
        return this.processHourlyData(data);
      default:
        return this.processDailyData(data);
    }
  }

  // Process data for ratings report
  private processRatingsData(data: any[], periodType: PeriodType) {
    // Extract all multiple choice questions from the data
    const questions = this.extractQuestions(data);
    
    // Process data by period
    let periods;
    switch (periodType) {
      case PeriodType.DAILY:
        periods = this.processRatingsByDay(data, questions);
        break;
      case PeriodType.WEEKLY:
        periods = this.processRatingsByWeek(data, questions);
        break;
      case PeriodType.MONTHLY:
        periods = this.processRatingsByMonth(data, questions);
        break;
      case PeriodType.HOURLY:
        periods = this.processRatingsByHour(data, questions);
        break;
      default:
        periods = this.processRatingsByDay(data, questions);
    }
    
    return {
      periods
    };
  }
  
  // Extract all multiple choice questions from the survey data
  private extractQuestions(data: any[]) {
    const questionsMap = new Map();
    
    data.forEach(transaction => {
      if (!transaction.survey?.metadata?.questions) return;
      
      // Get all multiple choice questions from the survey
      const multipleChoiceQuestions = transaction.survey.metadata.questions.filter(
        q => q.type === 'multiple'
      );
      
      multipleChoiceQuestions.forEach(question => {
        const questionId = question.id;
        if (!questionsMap.has(questionId)) {
          questionsMap.set(questionId, {
            id: questionId,
            text: question.question?.en || 'Unknown Question',
            textAr: question.question?.ar || '',
            choices: question.choices || [],
            count: 0,
            totalRating: 0,
            averageRating: 0
          });
        }
      });
    });
    
    return Array.from(questionsMap.values());
  }
  
  // Process ratings by day period
  private processRatingsByDay(data: any[], questions: any[]) {
    // Create a map of question IDs to question objects for quick lookup
    const questionsMap = new Map();
    questions.forEach(question => {
      questionsMap.set(question.id, question);
    });

    // Find date range
    let minDate = null;
    let maxDate = null;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!minDate || date < minDate) minDate = new Date(date);
        if (!maxDate || date > maxDate) maxDate = new Date(date);
      }
    });
    
    if (!minDate || !maxDate) {
      return [];
    }
    
    // Create map of all days in the range
    const dayMap = new Map();
    const utcMinDate = new Date(minDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
    const utcMaxDate = new Date(maxDate.toISOString().split('T')[0] + 'T23:59:59.999Z');
    
    const currentDate = new Date(utcMinDate);
    
    // Initialize question data structure for each day
    while (currentDate <= utcMaxDate) {
      const dayKey = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Initialize ratings data for each question
      const questionRatings = {};
      questions.forEach(question => {
        questionRatings[question.id] = {
        count: 0,
          totalRating: 0,
          averageRating: 0
        };
      });
      
      dayMap.set(dayKey, {
        period: dayKey,
        overallCount: 0,
        overallTotalRating: 0,
        overallAverageRating: 0,
        questions: questionRatings
      });
      
      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    // Process each transaction
    data.forEach(transaction => {
      if (!transaction.createdAt || !transaction.answers) return;
      
      const date = new Date(transaction.createdAt);
        const dayKey = date.toISOString().split('T')[0];
                
      if (!dayMap.has(dayKey)) return;
      
          const dayData = dayMap.get(dayKey);
      
      // Process multiple choice answers
      const multipleChoiceAnswers = transaction.answers.filter(a => a.type === 'multiple');
      
      multipleChoiceAnswers.forEach(answer => {
        // Convert answer to rating in range 0.0-1.0
        const rating = Number(answer.answer) / 5;
        
        // Update overall stats
        dayData.overallCount++;
        dayData.overallTotalRating += rating;
        
        // Update specific question stats if we have this question in our list
        if (dayData.questions[answer.id]) {
          dayData.questions[answer.id].count++;
          dayData.questions[answer.id].totalRating += rating;
        }
      });
      
      // Calculate averages
      if (dayData.overallCount > 0) {
        dayData.overallAverageRating = dayData.overallTotalRating / dayData.overallCount;
      }
      
      // Calculate averages for each question
      for (const questionId in dayData.questions) {
        const qData = dayData.questions[questionId];
        if (qData.count > 0) {
          qData.averageRating = qData.totalRating / qData.count;
        }
      }
    });
    
    // Convert map to array and format for response
    return Array.from(dayMap.entries()).map(([period, data]) => {
      const questionRatings = [];
      
      for (const questionId in data.questions) {
        const question = questionsMap.get(questionId);
        questionRatings.push({
          questionId,
          questionName: question ? question.text : 'Unknown Question',
          count: data.questions[questionId].count,
          averageRating: data.questions[questionId].averageRating.toFixed(2) * 5
        });
      }
      
      return {
        period,
        overallCount: data.overallCount,
        overallAverageRating: data.overallAverageRating.toFixed(2),
        questionRatings
      };
    });
  }
  
  // Process ratings by week period
  private processRatingsByWeek(data: any[], questions: any[]) {
    // Create a map of question IDs to question objects for quick lookup
    const questionsMap = new Map();
    questions.forEach(question => {
      questionsMap.set(question.id, question);
    });

    // Find date range
    let minDate = null;
    let maxDate = null;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!minDate || date < minDate) minDate = new Date(date);
        if (!maxDate || date > maxDate) maxDate = new Date(date);
      }
    });
    
    if (!minDate || !maxDate) {
      return [];
    }
    
    // Generate week ranges using UTC dates
    const weekRanges = [];
    const startWeek = moment.utc(minDate).startOf('week');
    const endWeek = moment.utc(maxDate).endOf('week');
    
    let currentWeek = startWeek.clone();
    while (currentWeek.isSameOrBefore(endWeek)) {
      const weekStart = currentWeek.clone();
      const weekEnd = currentWeek.clone().endOf('week');
      
      // Format as "Apr 04-27 to Apr 05-03"
      const weekKey = `${weekStart.format('MMM')} ${weekStart.format('MM')}-${weekStart.format('DD')} to ${weekEnd.format('MMM')} ${weekEnd.format('MM')}-${weekEnd.format('DD')}`;
      
      // Initialize ratings data for each question
      const questionRatings = {};
      questions.forEach(question => {
        questionRatings[question.id] = {
          count: 0,
          totalRating: 0,
          averageRating: 0
        };
      });
      
      weekRanges.push({
        key: weekKey,
        start: weekStart.toDate(),
        end: weekEnd.toDate(),
        overallCount: 0,
        overallTotalRating: 0,
        overallAverageRating: 0,
        questions: questionRatings
      });
      
      currentWeek.add(1, 'week');
    }
    
    // Process each transaction
    data.forEach(transaction => {
      if (!transaction.createdAt || !transaction.answers) return;
      
      const date = moment.utc(transaction.createdAt).toDate();
        
        // Find the corresponding week
      for (const weekRange of weekRanges) {
        if (date >= weekRange.start && date <= weekRange.end) {
          // Process multiple choice answers
          const multipleChoiceAnswers = transaction.answers.filter(a => a.type === 'multiple');
          
          multipleChoiceAnswers.forEach(answer => {
            // Convert answer to rating in range 0.0-1.0
            const rating = Number(answer.answer) / 5;
            
            // Update overall stats
            weekRange.overallCount++;
            weekRange.overallTotalRating += rating;
            
            // Update specific question stats if we have this question in our list
            if (weekRange.questions[answer.id]) {
              weekRange.questions[answer.id].count++;
              weekRange.questions[answer.id].totalRating += rating;
            }
          });
          
          break;
        }
      }
    });
    
    // Calculate averages
    for (const weekRange of weekRanges) {
      if (weekRange.overallCount > 0) {
        weekRange.overallAverageRating = weekRange.overallTotalRating / weekRange.overallCount;
      }
      
      // Calculate averages for each question
      for (const questionId in weekRange.questions) {
        const qData = weekRange.questions[questionId];
        if (qData.count > 0) {
          qData.averageRating = qData.totalRating / qData.count;
        }
      }
    }
    
    // Format for response
    return weekRanges.map(weekRange => {
      const questionRatings = [];
      
      for (const questionId in weekRange.questions) {
        const question = questionsMap.get(questionId);
        questionRatings.push({
          questionId,
          questionName: question ? question.text : 'Unknown Question',
          count: weekRange.questions[questionId].count,
          averageRating: weekRange.questions[questionId].averageRating.toFixed(2)
        });
      }
      
      return {
        period: weekRange.key,
        overallCount: weekRange.overallCount,
        overallAverageRating: weekRange.overallAverageRating.toFixed(2),
        questionRatings
      };
    });
  }
  
  // Process ratings by month period
  private processRatingsByMonth(data: any[], questions: any[]) {
    // Create a map of question IDs to question objects for quick lookup
    const questionsMap = new Map();
    questions.forEach(question => {
      questionsMap.set(question.id, question);
    });

    // Find date range
    let minDate = null;
    let maxDate = null;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!minDate || date < minDate) minDate = new Date(date);
        if (!maxDate || date > maxDate) maxDate = new Date(date);
      }
    });
    
    if (!minDate || !maxDate) {
      return [];
    }
    
    // Create map of all months in the range using UTC
    const monthMap = new Map();
    const startMonth = new Date(Date.UTC(minDate.getUTCFullYear(), minDate.getUTCMonth(), 1));
    const endMonth = new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), 1));
    
    let currentMonth = new Date(startMonth);
    while (currentMonth <= endMonth) {
      const year = currentMonth.getUTCFullYear();
      const month = currentMonth.getUTCMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthName = new Date(Date.UTC(year, month, 1)).toLocaleString('default', { month: 'long', year: 'numeric' });
      
      // Initialize ratings data for each question
      const questionRatings = {};
      questions.forEach(question => {
        questionRatings[question.id] = {
          count: 0,
          totalRating: 0,
          averageRating: 0
        };
      });
      
      monthMap.set(monthKey, {
        period: monthName,
        overallCount: 0,
        overallTotalRating: 0,
        overallAverageRating: 0,
        questions: questionRatings
      });
      
      // Move to next month
      currentMonth.setUTCMonth(currentMonth.getUTCMonth() + 1);
    }
    
    // Process each transaction
    data.forEach(transaction => {
      if (!transaction.createdAt || !transaction.answers) return;
      
      const date = new Date(transaction.createdAt);
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        
      if (!monthMap.has(monthKey)) return;
        
          const monthData = monthMap.get(monthKey);
      
      // Process multiple choice answers
      const multipleChoiceAnswers = transaction.answers.filter(a => a.type === 'multiple');
      
      multipleChoiceAnswers.forEach(answer => {
        // Convert answer to rating in range 0.0-1.0
        const rating = Number(answer.answer) / 5;
        
        // Update overall stats
        monthData.overallCount++;
        monthData.overallTotalRating += rating;
        
        // Update specific question stats if we have this question in our list
        if (monthData.questions[answer.id]) {
          monthData.questions[answer.id].count++;
          monthData.questions[answer.id].totalRating += rating;
        }
      });
    });
    
    // Calculate averages
    for (const [monthKey, monthData] of monthMap.entries()) {
      if (monthData.overallCount > 0) {
        monthData.overallAverageRating = monthData.overallTotalRating / monthData.overallCount;
      }
      
      // Calculate averages for each question
      for (const questionId in monthData.questions) {
        const qData = monthData.questions[questionId];
        if (qData.count > 0) {
          qData.averageRating = qData.totalRating / qData.count;
        }
      }
    }
    
    // Convert map to array and format for response
    return Array.from(monthMap.entries()).map(([key, data]) => ({
      period: data.period,
      overallCount: data.overallCount,
      overallAverageRating: data.overallAverageRating.toFixed(2),
      questionRatings: Object.values(data.questions)
    }));
  }

  // New method for hourly processing in transaction counts
  private processHourlyData(data: any[]) {
    // Initialize data structure for each hour (0-23)
    const hourMap = new Map();
    
    for (let hour = 0; hour < 24; hour++) {
      // Format as "01:00 AM", "02:00 PM", etc.
      const period = `${String(hour % 12 || 12).padStart(2, '0')}:00 ${hour < 12 ? 'AM' : 'PM'}`;
      
      hourMap.set(hour, {
        count: 0,
        period: period,
        surveys: new Map(),
        categories: new Map(),
        touchpoints: new Map(),
        genders: new Map()
      });
    }
    
    // Count items for each hour
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        const hour = date.getUTCHours();
        
        const hourData = hourMap.get(hour);
        hourData.count += 1;
        
        // Count surveys
        const surveyId = item.surveyId;
        const surveyName = item.survey?.name || 'Unknown Survey';
        const surveyKey = `${surveyId}|${surveyName}`;
        
        if (!hourData.surveys.has(surveyKey)) {
          hourData.surveys.set(surveyKey, { id: surveyId, name: surveyName, count: 0 });
        }
        hourData.surveys.get(surveyKey).count += 1;
        
        // Count categories
        const categoryId = item.categoryId;
        const categoryName = item.category?.name?.en || 'Unknown Category';
        const categoryKey = `${categoryId}|${categoryName}`;
        
        if (!hourData.categories.has(categoryKey)) {
          hourData.categories.set(categoryKey, { id: categoryId, name: categoryName, count: 0 });
        }
        hourData.categories.get(categoryKey).count += 1;
        
        // Count touchpoints
        const touchpointId = item.touchpointId;
        const touchpointName = item.touchpoint?.name?.en || 'Unknown Touchpoint';
        const touchpointKey = `${touchpointId}|${touchpointName}`;
        
        if (!hourData.touchpoints.has(touchpointKey)) {
          hourData.touchpoints.set(touchpointKey, { id: touchpointId, name: touchpointName, count: 0 });
        }
        hourData.touchpoints.get(touchpointKey).count += 1;
        
        // Count genders
        const gender = item.customer?.gender || 'Unknown';
        
        if (!hourData.genders.has(gender)) {
          hourData.genders.set(gender, { gender, count: 0 });
        }
        hourData.genders.get(gender).count += 1;
      }
    });
    
    // Convert map to array and transform nested maps to arrays
    return Array.from(hourMap.entries())
      .sort((a, b) => a[0] - b[0])  // Sort by hour
      .map(([hour, data]) => ({
        period: data.period,
        count: data.count,
        surveys: Array.from(data.surveys.values()),
        categories: Array.from(data.categories.values()),
        touchpoints: Array.from(data.touchpoints.values()),
        genders: Array.from(data.genders.values())
      }));
  }

  // Process touchpoints data grouped by the selected period
  private processTouchpointsDataByPeriod(data: any[], periodType: PeriodType) {
    switch (periodType) {
      case PeriodType.DAILY:
        return this.processTouchpointsByDay(data);
      case PeriodType.WEEKLY:
        return this.processTouchpointsByWeek(data);
      case PeriodType.MONTHLY:
        return this.processTouchpointsByMonth(data);
      case PeriodType.HOURLY:
        return this.processTouchpointsByHour(data);
      default:
        return this.processTouchpointsByDay(data);
    }
  }

  // Process touchpoints by day
  private processTouchpointsByDay(data: any[]) {
    // Find date range
    let minDate = null;
    let maxDate = null;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!minDate || date < minDate) minDate = new Date(date);
        if (!maxDate || date > maxDate) maxDate = new Date(date);
      }
    });
    
    if (!minDate || !maxDate) {
      return [];
    }
    
    // Create map of all days in the range
    const dayMap = new Map();
    const utcMinDate = new Date(minDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
    const utcMaxDate = new Date(maxDate.toISOString().split('T')[0] + 'T23:59:59.999Z');
    
    const currentDate = new Date(utcMinDate);
    
    // Initialize touchpoint data structure for each day
    while (currentDate <= utcMaxDate) {
      const dayKey = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      dayMap.set(dayKey, {
        period: dayKey,
        touchpoints: new Map<string, Touchpoint>()
      });
      
      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    // Process each transaction
    data.forEach(item => {
      try {
        if (!item.createdAt) return;

        // Get the day for this transaction
        const date = new Date(item.createdAt);
        const dayKey = date.toISOString().split('T')[0];
        
        if (!dayMap.has(dayKey)) return;
        
        const dayData = dayMap.get(dayKey);
        
        // Skip items without any identifiable touchpoint
        if (!item) return;

        // Extract touchpoint ID and name using multiple possible data structures
        let touchpointId = 'unknown';
        let touchpointName = 'Unknown Touchpoint';
        
        // First try direct properties
        if (item.touchpointId) {
          touchpointId = item.touchpointId;
        }
        
        // Try different paths to extract touchpoint name
        if (item.touchpoint && item.touchpoint.name) {
          if (typeof item.touchpoint.name === 'string') {
            touchpointName = item.touchpoint.name;
          } else if (item.touchpoint.name.en) {
            touchpointName = item.touchpoint.name.en;
          } else if (item.touchpoint.name.ar) {
            touchpointName = item.touchpoint.name.ar;
          }
        } else if (item.touchpoint && typeof item.touchpoint === 'string') {
          touchpointName = item.touchpoint;
        } else if (item.touchpointName) {
          touchpointName = item.touchpointName;
        }
        
        // Check if we have an entity called 'point' or 'location' instead
        if ((!item.touchpointId && !item.touchpoint) && (item.pointId || item.locationId)) {
          touchpointId = item.pointId || item.locationId || touchpointId;
          if (item.point && item.point.name) {
            touchpointName = typeof item.point.name === 'string' ? 
              item.point.name : (item.point.name.en || item.point.name.ar || touchpointName);
          } else if (item.location && item.location.name) {
            touchpointName = typeof item.location.name === 'string' ? 
              item.location.name : (item.location.name.en || item.location.name.ar || touchpointName);
          }
        }
        
        // Skip if we don't have meaningful information
        if (touchpointId === 'unknown' && touchpointName === 'Unknown Touchpoint') {
          return;
        }
        
        // Create a unique key for this touchpoint
        const touchpointKey = `${touchpointId}|${touchpointName}`;
        
        // Add or update touchpoint count for this day
        if (!dayData.touchpoints.has(touchpointKey)) {
          dayData.touchpoints.set(touchpointKey, { 
            id: touchpointId, 
            name: touchpointName, 
            count: 0 
          });
        }
        
        dayData.touchpoints.get(touchpointKey)!.count += 1;
      } catch (error) {
        console.error('Error processing touchpoint item:', error);
      }
    });
    
    // Convert map to array and format for response
    return Array.from(dayMap.entries()).map(([period, data]) => {
      // Sort touchpoints by count for each day and convert to array
      const touchpoints = Array.from(data.touchpoints.values() as IterableIterator<Touchpoint>)
        .sort((a, b) => b.count - a.count);
      
      return {
        period,
        touchpoints
      };
    });
  }

  // Process touchpoints by week
  private processTouchpointsByWeek(data: any[]) {
    // Find date range
    let minDate = null;
    let maxDate = null;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!minDate || date < minDate) minDate = new Date(date);
        if (!maxDate || date > maxDate) maxDate = new Date(date);
      }
    });
    
    if (!minDate || !maxDate) {
      return [];
    }
    
    // Generate week ranges using UTC dates
    const weekMap = new Map();
    const startWeek = moment.utc(minDate).startOf('week');
    const endWeek = moment.utc(maxDate).endOf('week');
    
    let currentWeek = startWeek.clone();
    while (currentWeek.isSameOrBefore(endWeek)) {
      const weekStart = currentWeek.clone();
      const weekEnd = currentWeek.clone().endOf('week');
      
      // Format as "Apr 04-27 to Apr 05-03"
      const weekKey = `${weekStart.format('MMM')} ${weekStart.format('MM')}-${weekStart.format('DD')} to ${weekEnd.format('MMM')} ${weekEnd.format('MM')}-${weekEnd.format('DD')}`;
      
      weekMap.set(weekKey, {
        period: weekKey,
        start: weekStart.toDate(),
        end: weekEnd.toDate(),
        touchpoints: new Map<string, Touchpoint>()
      });
      
      currentWeek.add(1, 'week');
    }
    
    // Process each transaction
    data.forEach(item => {
      try {
        if (!item.createdAt) return;
        
        const date = moment.utc(item.createdAt).toDate();
        
        // Find the corresponding week
        let weekData = null;
        
        for (const [key, week] of weekMap.entries()) {
          if (date >= week.start && date <= week.end) {
            weekData = week;
            break;
          }
        }
        
        if (!weekData) return;
        
        // Extract touchpoint information
        let touchpointId = 'unknown';
        let touchpointName = 'Unknown Touchpoint';
        
        if (item.touchpointId) {
          touchpointId = item.touchpointId;
        }
        
        if (item.touchpoint && item.touchpoint.name) {
          if (typeof item.touchpoint.name === 'string') {
            touchpointName = item.touchpoint.name;
          } else if (item.touchpoint.name.en) {
            touchpointName = item.touchpoint.name.en;
          } else if (item.touchpoint.name.ar) {
            touchpointName = item.touchpoint.name.ar;
          }
        } else if (item.touchpoint && typeof item.touchpoint === 'string') {
          touchpointName = item.touchpoint;
        } else if (item.touchpointName) {
          touchpointName = item.touchpointName;
        }
        
        // Skip if we don't have meaningful information
        if (touchpointId === 'unknown' && touchpointName === 'Unknown Touchpoint') {
          return;
        }
        
        const touchpointKey = `${touchpointId}|${touchpointName}`;
        
        // Add or update touchpoint count for this week
        if (!weekData.touchpoints.has(touchpointKey)) {
          weekData.touchpoints.set(touchpointKey, { 
            id: touchpointId, 
            name: touchpointName, 
            count: 0 
          });
        }
        
        weekData.touchpoints.get(touchpointKey)!.count += 1;
      } catch (error) {
        console.error('Error processing touchpoint item for week:', error);
      }
    });
    
    // Convert map to array and format for response
    return Array.from(weekMap.entries()).map(([period, data]) => {
      // Sort touchpoints by count for each week and convert to array
      const touchpoints = Array.from(data.touchpoints.values() as IterableIterator<Touchpoint>)
        .sort((a, b) => b.count - a.count);
      
      return {
        period,
        touchpoints
      };
    });
  }

  // Process touchpoints by month
  private processTouchpointsByMonth(data: any[]) {
    // Find date range
    let minDate = null;
    let maxDate = null;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!minDate || date < minDate) minDate = new Date(date);
        if (!maxDate || date > maxDate) maxDate = new Date(date);
      }
    });
    
    if (!minDate || !maxDate) {
      return [];
    }
    
    // Create map of all months in the range using UTC
    const monthMap = new Map();
    const startMonth = new Date(Date.UTC(minDate.getUTCFullYear(), minDate.getUTCMonth(), 1));
    const endMonth = new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), 1));
    
    let currentMonth = new Date(startMonth);
    while (currentMonth <= endMonth) {
      const year = currentMonth.getUTCFullYear();
      const month = currentMonth.getUTCMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthName = new Date(Date.UTC(year, month, 1)).toLocaleString('default', { month: 'long', year: 'numeric' });
      
      monthMap.set(monthKey, {
        period: monthName,
        touchpoints: new Map<string, Touchpoint>()
      });
      
      // Move to next month
      currentMonth.setUTCMonth(currentMonth.getUTCMonth() + 1);
    }
    
    // Process each transaction
    data.forEach(item => {
      try {
        if (!item.createdAt) return;
        
        // Get the month for this transaction
        const date = new Date(item.createdAt);
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        if (!monthMap.has(monthKey)) return;
        
        const monthData = monthMap.get(monthKey);
        
        // Extract touchpoint information
        let touchpointId = 'unknown';
        let touchpointName = 'Unknown Touchpoint';
        
        if (item.touchpointId) {
          touchpointId = item.touchpointId;
        }
        
        if (item.touchpoint && item.touchpoint.name) {
          if (typeof item.touchpoint.name === 'string') {
            touchpointName = item.touchpoint.name;
          } else if (item.touchpoint.name.en) {
            touchpointName = item.touchpoint.name.en;
          } else if (item.touchpoint.name.ar) {
            touchpointName = item.touchpoint.name.ar;
          }
        } else if (item.touchpoint && typeof item.touchpoint === 'string') {
          touchpointName = item.touchpoint;
        } else if (item.touchpointName) {
          touchpointName = item.touchpointName;
        }
        
        // Skip if we don't have meaningful information
        if (touchpointId === 'unknown' && touchpointName === 'Unknown Touchpoint') {
          return;
        }
        
        const touchpointKey = `${touchpointId}|${touchpointName}`;
        
        // Add or update touchpoint count for this month
        if (!monthData.touchpoints.has(touchpointKey)) {
          monthData.touchpoints.set(touchpointKey, { 
            id: touchpointId, 
            name: touchpointName, 
            count: 0 
          });
        }
        
        monthData.touchpoints.get(touchpointKey)!.count += 1;
      } catch (error) {
        console.error('Error processing touchpoint item for month:', error);
      }
    });
    
    // Convert map to array and format for response
    return Array.from(monthMap.entries()).map(([key, data]) => {
      // Sort touchpoints by count for each month and convert to array
      const touchpoints = Array.from(data.touchpoints.values() as IterableIterator<Touchpoint>)
        .sort((a, b) => b.count - a.count);
      
      return {
        period: data.period,
        touchpoints
      };
    });
  }

  // Process touchpoints by hour
  private processTouchpointsByHour(data: any[]) {
    // Initialize data structure for each hour (0-23)
    const hourMap = new Map();
    
    for (let hour = 0; hour < 24; hour++) {
      // Format as "01:00 AM", "02:00 PM", etc.
      const period = `${String(hour % 12 || 12).padStart(2, '0')}:00 ${hour < 12 ? 'AM' : 'PM'}`;
      
      hourMap.set(hour, {
        period,
        touchpoints: new Map<string, Touchpoint>()
      });
    }
    
    // Process each transaction
    data.forEach(item => {
      try {
        if (!item.createdAt) return;
        
        // Get the hour for this transaction
        const date = new Date(item.createdAt);
        const hour = date.getUTCHours();
        
        const hourData = hourMap.get(hour);
        
        // Extract touchpoint information
        let touchpointId = 'unknown';
        let touchpointName = 'Unknown Touchpoint';
        
        if (item.touchpointId) {
          touchpointId = item.touchpointId;
        }
        
        if (item.touchpoint && item.touchpoint.name) {
          if (typeof item.touchpoint.name === 'string') {
            touchpointName = item.touchpoint.name;
          } else if (item.touchpoint.name.en) {
            touchpointName = item.touchpoint.name.en;
          } else if (item.touchpoint.name.ar) {
            touchpointName = item.touchpoint.name.ar;
          }
        } else if (item.touchpoint && typeof item.touchpoint === 'string') {
          touchpointName = item.touchpoint;
        } else if (item.touchpointName) {
          touchpointName = item.touchpointName;
        }
        
        // Skip if we don't have meaningful information
        if (touchpointId === 'unknown' && touchpointName === 'Unknown Touchpoint') {
          return;
        }
        
        const touchpointKey = `${touchpointId}|${touchpointName}`;
        
        // Add or update touchpoint count for this hour
        if (!hourData.touchpoints.has(touchpointKey)) {
          hourData.touchpoints.set(touchpointKey, { 
            id: touchpointId, 
            name: touchpointName, 
            count: 0 
          });
        }
        
        hourData.touchpoints.get(touchpointKey)!.count += 1;
      } catch (error) {
        console.error('Error processing touchpoint item for hour:', error);
      }
    });
    
    // Convert map to array and format for response
    return Array.from(hourMap.entries())
      .sort((a, b) => a[0] - b[0])  // Sort by hour
      .map(([hour, data]) => {
        // Sort touchpoints by count for each hour and convert to array
        const touchpoints = Array.from(data.touchpoints.values() as IterableIterator<Touchpoint>)
          .sort((a, b) => b.count - a.count);
        
        return {
          period: data.period,
          touchpoints
        };
      });
  }

  private processDailyData(data: any[]) {
    // Find date range
    let minDate = null;
    let maxDate = null;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!minDate || date < minDate) minDate = new Date(date);
        if (!maxDate || date > maxDate) maxDate = new Date(date);
      }
    });
    
    // If no data or invalid dates, return empty array
    if (!minDate || !maxDate) {
      return [];
    }
    
    // Create map of all days in the range
    const dayMap = new Map();
    
    // Ensure we're working with UTC dates for consistency
    const utcMinDate = new Date(minDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
    const utcMaxDate = new Date(maxDate.toISOString().split('T')[0] + 'T23:59:59.999Z');
    
    const currentDate = new Date(utcMinDate);
    
    // Create date buckets for each day in range
    while (currentDate <= utcMaxDate) {
      const dayKey = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      dayMap.set(dayKey, {
        count: 0,
        period: dayKey,
        surveys: new Map(),
        categories: new Map(),
        touchpoints: new Map(),
        genders: new Map()
      });
      
      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    // Count items for each day
    data.forEach(item => {
      if (item.createdAt) {
        // Use UTC date to avoid timezone issues
        const date = new Date(item.createdAt);
        const dayKey = date.toISOString().split('T')[0];
                
        if (dayMap.has(dayKey)) {
          const dayData = dayMap.get(dayKey);
          dayData.count += 1;
          
          // Count surveys
          const surveyId = item.surveyId;
          const surveyName = item.survey?.name || 'Unknown Survey';
          const surveyKey = `${surveyId}|${surveyName}`;
          
          if (!dayData.surveys.has(surveyKey)) {
            dayData.surveys.set(surveyKey, { id: surveyId, name: surveyName, count: 0 });
          }
          dayData.surveys.get(surveyKey).count += 1;
          
          // Count categories
          const categoryId = item.categoryId;
          const categoryName = item.category?.name?.en || 'Unknown Category';
          const categoryKey = `${categoryId}|${categoryName}`;
          
          if (!dayData.categories.has(categoryKey)) {
            dayData.categories.set(categoryKey, { id: categoryId, name: categoryName, count: 0 });
          }
          dayData.categories.get(categoryKey).count += 1;
          
          // Count touchpoints
      const touchpointId = item.touchpointId;
      const touchpointName = item.touchpoint?.name?.en || 'Unknown Touchpoint';
          const touchpointKey = `${touchpointId}|${touchpointName}`;
          
          if (!dayData.touchpoints.has(touchpointKey)) {
            dayData.touchpoints.set(touchpointKey, { id: touchpointId, name: touchpointName, count: 0 });
          }
          dayData.touchpoints.get(touchpointKey).count += 1;
          
          // Count genders
          const gender = item.customer?.gender || 'Unknown';
          
          if (!dayData.genders.has(gender)) {
            dayData.genders.set(gender, { gender, count: 0 });
          }
          dayData.genders.get(gender).count += 1;
        } else {
          console.log(`Warning: No bucket found for day: ${dayKey}`);
        }
      }
    });
    
    // Convert map to array and transform nested maps to arrays
    const result = Array.from(dayMap.entries()).map(([period, data]) => ({
      period,
      count: data.count,
      surveys: Array.from(data.surveys.values()),
      categories: Array.from(data.categories.values()),
      touchpoints: Array.from(data.touchpoints.values()),
      genders: Array.from(data.genders.values())
    }));
    
    
    return result;
  }

  private processWeeklyData(data: any[]) {
    // Find date range
    let minDate = null;
    let maxDate = null;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!minDate || date < minDate) minDate = new Date(date);
        if (!maxDate || date > maxDate) maxDate = new Date(date);
      }
    });
    
    // If no data or invalid dates, return empty array
    if (!minDate || !maxDate) {
      return [];
    }
    
    // Generate week ranges using UTC dates
    const weekRanges = [];
    const startWeek = moment.utc(minDate).startOf('week');
    const endWeek = moment.utc(maxDate).endOf('week');
    
    let currentWeek = startWeek.clone();
    while (currentWeek.isSameOrBefore(endWeek)) {
      const weekStart = currentWeek.clone();
      const weekEnd = currentWeek.clone().endOf('week');
      
      // Format as "Apr 04-27 to Apr 05-03"
      const weekKey = `${weekStart.format('MMM')} ${weekStart.format('MM')}-${weekStart.format('DD')} to ${weekEnd.format('MMM')} ${weekEnd.format('MM')}-${weekEnd.format('DD')}`;
      
      weekRanges.push({
        key: weekKey,
        start: weekStart.toDate(),
        end: weekEnd.toDate()
      });
      
      currentWeek.add(1, 'week');
    }
    
    // Create map of all weeks in the range
    const weekMap = new Map();
    
    weekRanges.forEach(range => {
      weekMap.set(range.key, {
          count: 0,
        period: range.key,
        surveys: new Map(),
        categories: new Map(),
        touchpoints: new Map(),
        genders: new Map()
      });
    });
    
    // Count items for each week
    data.forEach(item => {
      if (item.createdAt) {
        const date = moment.utc(item.createdAt).toDate();
        
        // Find the corresponding week
        for (const range of weekRanges) {
          if (date >= range.start && date <= range.end) {
            
            const weekData = weekMap.get(range.key);
            weekData.count += 1;
            
            // Count surveys
            const surveyId = item.surveyId;
            const surveyName = item.survey?.name || 'Unknown Survey';
            const surveyKey = `${surveyId}|${surveyName}`;
            
            if (!weekData.surveys.has(surveyKey)) {
              weekData.surveys.set(surveyKey, { id: surveyId, name: surveyName, count: 0 });
            }
            weekData.surveys.get(surveyKey).count += 1;
            
            // Count categories
            const categoryId = item.categoryId;
            const categoryName = item.category?.name?.en || 'Unknown Category';
            const categoryKey = `${categoryId}|${categoryName}`;
            
            if (!weekData.categories.has(categoryKey)) {
              weekData.categories.set(categoryKey, { id: categoryId, name: categoryName, count: 0 });
            }
            weekData.categories.get(categoryKey).count += 1;
            
            // Count touchpoints
            const touchpointId = item.touchpointId;
            const touchpointName = item.touchpoint?.name?.en || 'Unknown Touchpoint';
            const touchpointKey = `${touchpointId}|${touchpointName}`;
            
            if (!weekData.touchpoints.has(touchpointKey)) {
              weekData.touchpoints.set(touchpointKey, { id: touchpointId, name: touchpointName, count: 0 });
            }
            weekData.touchpoints.get(touchpointKey).count += 1;
            
            // Count genders
            const gender = item.customer?.gender || 'Unknown';
            
            if (!weekData.genders.has(gender)) {
              weekData.genders.set(gender, { gender, count: 0 });
            }
            weekData.genders.get(gender).count += 1;
            
            break;
          }
        }
      }
    });
    
    // Convert map to array and transform nested maps to arrays
    const result = Array.from(weekMap.entries()).map(([period, data]) => ({
      period,
      count: data.count,
      surveys: Array.from(data.surveys.values()),
      categories: Array.from(data.categories.values()),
      touchpoints: Array.from(data.touchpoints.values()),
      genders: Array.from(data.genders.values())
    }));    
    return result;
  }

  private processMonthlyData(data: any[]) {
    // Find date range
    let minDate = null;
    let maxDate = null;
    
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!minDate || date < minDate) minDate = new Date(date);
        if (!maxDate || date > maxDate) maxDate = new Date(date);
      }
    });
    
    // If no data or invalid dates, return empty array
    if (!minDate || !maxDate) {
      return [];
    }
    
    // Create map of all months in the range using UTC
    const monthMap = new Map();
    const startMonth = new Date(Date.UTC(minDate.getUTCFullYear(), minDate.getUTCMonth(), 1));
    const endMonth = new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), 1));
    
    let currentMonth = new Date(startMonth);
    while (currentMonth <= endMonth) {
      const year = currentMonth.getUTCFullYear();
      const month = currentMonth.getUTCMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthName = new Date(Date.UTC(year, month, 1)).toLocaleString('default', { month: 'long', year: 'numeric' });
      
      monthMap.set(monthKey, {
        count: 0,
        period: monthName,
        surveys: new Map(),
        categories: new Map(),
        touchpoints: new Map(),
        genders: new Map()
      });
      
      // Move to next month
      currentMonth.setUTCMonth(currentMonth.getUTCMonth() + 1);
    }
    
    // Count items for each month
    data.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        if (monthMap.has(monthKey)) {
          const monthData = monthMap.get(monthKey);
          monthData.count += 1;
          
          // Count surveys
          const surveyId = item.surveyId;
          const surveyName = item.survey?.name || 'Unknown Survey';
          const surveyKey = `${surveyId}|${surveyName}`;
          
          if (!monthData.surveys.has(surveyKey)) {
            monthData.surveys.set(surveyKey, { id: surveyId, name: surveyName, count: 0 });
          }
          monthData.surveys.get(surveyKey).count += 1;
          
          // Count categories
          const categoryId = item.categoryId;
          const categoryName = item.category?.name?.en || 'Unknown Category';
          const categoryKey = `${categoryId}|${categoryName}`;
          
          if (!monthData.categories.has(categoryKey)) {
            monthData.categories.set(categoryKey, { id: categoryId, name: categoryName, count: 0 });
          }
          monthData.categories.get(categoryKey).count += 1;
          
          // Count touchpoints
          const touchpointId = item.touchpointId;
          const touchpointName = item.touchpoint?.name?.en || 'Unknown Touchpoint';
          const touchpointKey = `${touchpointId}|${touchpointName}`;
          
          if (!monthData.touchpoints.has(touchpointKey)) {
            monthData.touchpoints.set(touchpointKey, { id: touchpointId, name: touchpointName, count: 0 });
          }
          monthData.touchpoints.get(touchpointKey).count += 1;
          
          // Count genders
          const gender = item.customer?.gender || 'Unknown';
          
          if (!monthData.genders.has(gender)) {
            monthData.genders.set(gender, { gender, count: 0 });
          }
          monthData.genders.get(gender).count += 1;
        } else {
          console.log(`Warning: No bucket found for month: ${monthKey}`);
        }
      }
    });
    
    // Convert map to array and transform nested maps to arrays
    const result = Array.from(monthMap.entries()).map(([key, data]) => ({
      period: data.period,
      count: data.count,
      surveys: Array.from(data.surveys.values()),
      categories: Array.from(data.categories.values()),
      touchpoints: Array.from(data.touchpoints.values()),
      genders: Array.from(data.genders.values())
    }));
    
    return result;
  }

  // Process ratings by hour
  private processRatingsByHour(data: any[], questions: any[]) {
    // Create a map of question IDs to question objects for quick lookup
    const questionsMap = new Map();
    questions.forEach(question => {
      questionsMap.set(question.id, question);
    });

    // Initialize data structure for each hour (0-23)
    const hourMap = new Map();
    
    for (let hour = 0; hour < 24; hour++) {
      // Format as "01:00 AM", "02:00 PM", etc.
      const period = `${String(hour % 12 || 12).padStart(2, '0')}:00 ${hour < 12 ? 'AM' : 'PM'}`;
      
      hourMap.set(hour, {
        period,
        overallCount: 0,
        overallTotalRating: 0,
        overallAverageRating: 0,
        questions: {}
      });
    }
    
    // Process each transaction
    data.forEach(transaction => {
      if (!transaction.createdAt || !transaction.answers) return;
      
      const date = new Date(transaction.createdAt);
      const hour = date.getUTCHours();
      
      const hourData = hourMap.get(hour);
      
      // Process multiple choice answers
      const multipleChoiceAnswers = transaction.answers.filter(a => a.type === 'multiple');
      
      multipleChoiceAnswers.forEach(answer => {
        // Convert answer to rating in range 0.0-1.0
        const rating = Number(answer.answer) / 5;
        
        // Update overall stats
        hourData.overallCount++;
        hourData.overallTotalRating += rating;
        
        // Update specific question stats if we have this question in our list
        if (!hourData.questions[answer.id]) {
          hourData.questions[answer.id] = {
            count: 0,
            totalRating: 0,
            averageRating: 0
          };
        }
        
        hourData.questions[answer.id].count++;
        hourData.questions[answer.id].totalRating += rating;
      });
    });
    
    // Calculate averages
    for (const [hour, hourData] of hourMap.entries()) {
      if (hourData.overallCount > 0) {
        hourData.overallAverageRating = hourData.overallTotalRating / hourData.overallCount;
      }
      
      // Calculate averages for each question
      for (const questionId in hourData.questions) {
        const qData = hourData.questions[questionId];
        if (qData.count > 0) {
          qData.averageRating = qData.totalRating / qData.count;
        }
      }
    }
    
    // Convert map to array and format for response
    return Array.from(hourMap.entries())
      .sort((a, b) => a[0] - b[0])  // Sort by hour
      .map(([hour, data]) => {
        const questionRatings = [];
        
        for (const questionId in data.questions) {
          const question = questionsMap.get(questionId);
          questionRatings.push({
            questionId,
            questionName: question ? question.text : 'Unknown Question',
            count: data.questions[questionId].count,
            averageRating: data.questions[questionId].averageRating.toFixed(2)
          });
        }
    
    return {
          period: data.period,
          overallCount: data.overallCount,
          overallAverageRating: data.overallAverageRating.toFixed(2),
          questionRatings
        };
      });
  }
} 