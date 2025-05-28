/**
 * Example request for the dashboard statistics API
 * 
 * GET /statistics/dashboard
 * 
 * Headers:
 * Authorization: Bearer <token>
 */

/**
 * Example response from the dashboard statistics API
 */
export const dashboardStatisticsResponse = {
  "lostChildStats": {
    "openCasesCount": 3,
    "childFoundCasesCount": 2
  },
  "incidentStats": {
    "openCasesCount": 5,
    "pendingInternalCasesCount": 2
  },
  "lostFoundStats": {
    "openCasesCount": 8,
    "inProgressCasesCount": 4
  },
  "servicesStats": {
    "deliveryRequestsCount": 12,
    "pickupRequestsCount": 7
  },
  "voucherStats": {
    "inStockCount": 243,
    "soldTodayCount": 15
  },
  "feedbackStats": {
    "openCommentsCount": 18,
    "pendingSuggestionsCount": 6,
    "openPendingComplaintsCount": 9
  }
}; 