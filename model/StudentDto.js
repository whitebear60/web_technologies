import {BaseDto} from "./BaseDto.js";

export class StudentDto extends BaseDto {
    constructor(data) {
        super(data.id);
        this.last_name = data.last_name;
        this.first_name = data.first_name;
        this.middle_name = data.middle_name;
        this.group = data.group;
    }
}