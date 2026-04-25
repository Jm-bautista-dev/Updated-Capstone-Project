import Auth from './Auth'
import Api from './Api'
import MobileAuthController from './MobileAuthController'
import BranchController from './BranchController'
import NotificationController from './NotificationController'
import Customer from './Customer'
import StockInController from './StockInController'
import Admin from './Admin'
import ProductsController from './ProductsController'
import InventoryController from './InventoryController'
import PosController from './PosController'
import CategoriesController from './CategoriesController'
import WastageController from './WastageController'
import SalesController from './SalesController'
import InventoryActionController from './InventoryActionController'
import Settings from './Settings'
const Controllers = {
    Auth: Object.assign(Auth, Auth),
Api: Object.assign(Api, Api),
MobileAuthController: Object.assign(MobileAuthController, MobileAuthController),
BranchController: Object.assign(BranchController, BranchController),
NotificationController: Object.assign(NotificationController, NotificationController),
Customer: Object.assign(Customer, Customer),
StockInController: Object.assign(StockInController, StockInController),
Admin: Object.assign(Admin, Admin),
ProductsController: Object.assign(ProductsController, ProductsController),
InventoryController: Object.assign(InventoryController, InventoryController),
PosController: Object.assign(PosController, PosController),
CategoriesController: Object.assign(CategoriesController, CategoriesController),
WastageController: Object.assign(WastageController, WastageController),
SalesController: Object.assign(SalesController, SalesController),
InventoryActionController: Object.assign(InventoryActionController, InventoryActionController),
Settings: Object.assign(Settings, Settings),
}

export default Controllers