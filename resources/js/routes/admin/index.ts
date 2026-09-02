import salesData from './sales-data'
import pickups from './pickups'
import reviews from './reviews'
import accounts from './accounts'
const admin = {
    salesData: Object.assign(salesData, salesData),
pickups: Object.assign(pickups, pickups),
reviews: Object.assign(reviews, reviews),
accounts: Object.assign(accounts, accounts),
}

export default admin