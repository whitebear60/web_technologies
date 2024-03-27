import {BaseDto} from "./BaseDto.js";

export class PackingDto extends BaseDto {
    constructor(data) {
        super(data.packing_id);
        this.packing_name = data.packing_name;
        this.amount = data.amount;
    }
}