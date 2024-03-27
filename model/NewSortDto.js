import {BaseDto} from "./BaseDto.js";

export class NewSortDto extends BaseDto {
    constructor(data) {
        super(data.new_sort_id);
        this.date = data.date;
        this.comment = data.comment;
    }
}