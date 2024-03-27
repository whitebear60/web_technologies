import {BaseDto} from "./BaseDto.js";

export class SellerDto extends BaseDto{
    constructor(data) {
        super(data.seller_id);
        this.seller_name = data.seller_name;

    }

}