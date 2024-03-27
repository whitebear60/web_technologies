import {BaseDto} from "./BaseDto.js";

export class BatchDto extends BaseDto {
    constructor(data) {
        super(data.batch_id);
        this.packing_id = data.packing_id;
        this.packing_date = data.packing_date;
        this.end = data.end;
        this.weight = data.weight;
        this.price = data.price;
        this.sort_id = data.sort_id;
        this.batch_size = data.batch_size;
    }
}