import {BaseDto} from "./BaseDto.js";

export class PurchaseDto extends BaseDto {
    constructor(data) {
        super(data.purchase_id);
        this.client_id = data.client_id;
        this.batch_id = data.batch_id;
        this.buy_date = data.buy_date;
        this.amount = data.amount;
        this.seller_id = data.seller_id;
    }
}