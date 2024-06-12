import {BaseDto} from "./BaseDto.js";

export class ClassDto extends BaseDto {
    constructor(data) {
        super(data.id);
        this.class_name = data.class_name;
        this.classroom = data.classroom;
        this.teacher = data.teacher;
    }
}