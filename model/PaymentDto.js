export class PaymentDto {
    constructor(data) {
        this.batch_id = data.batch_id;
        this.purchase_id = data.purchase_id;
        data.is_cash === 1 ? this.is_cash = true : this.is_cash = false;
        this.transaction_sum = data.transaction_sum;
    }
}