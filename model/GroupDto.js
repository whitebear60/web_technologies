import {BaseDto} from "./BaseDto.js";

export class GroupDto extends BaseDto{
    constructor(data) {
        super(data.id);
        this.name = data.name;
        this.year = data.year;
    }
}