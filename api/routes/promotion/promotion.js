const express = require('express');
const router = express.Router();

const alternate = (param) => {
    const result = {
        sql: null,
        values: null
    };

    if (param.id) {
        result.sql = "SELECT * FROM promotions WHERE promo_id=? ORDER BY promo_id DESC";
        result.values = [param.id];
    } else if (param.product_id) {
        result.sql = "SELECT * FROM promotions "
            + "WHERE promo_id IN (SELECT pp_promotion_id "
                + "FROM promotions_related_to_products "
                + "WHERE pp_product_id=?) "
            + "ORDER BY promo_id DESC";
        result.values = [param.product_id];
    } else if (param.name) {
        result.sql = "SELECT * FROM promotions WHERE promo_name=? ORDER BY promo_id DESC";
        result.values = [param.name];
    } else {
        result.sql = "SELECT * FROM promotions ORDER BY promo_id DESC";
        result.values = [];
    }

    return result;
};

const reorganize = (available, items, then) => {
    const promotions = [];

    const fetch = (i) => {
        env.get({url: "/promotion/related_to_product?promotion_id=*", params: [items[i].promo_id], then: (p) => {
            const val = items[i];
            const temp = {
                id: val.promo_id,
                start: val.promo_start,
                end: val.promo_end,
                discount: val.promo_discount,
                name: val.promo_name,
                detail: val.promo_details,
                images: JSON.parse(val.promo_imgURL),
                products: p.data != null ? p.data : []
            };

            if (available == 1) {
                if (env.date.between(val.promo_start, val.promo_end, env.date.simple())) {
                    promotions.push(temp);
                }
            } else {
                promotions.push(temp);
            }

            if (i + 1 < items.length) {
                fetch(i + 1);
            } else {
                then(promotions);
            }
        }});
    };

    fetch(0);
};

router.get('/', (req, res) => {
    const form = env.form(__dirname + '/form.json');
    const input = env.input(req);

    const alt = alternate(input.url);

    env.database.query(alt.sql, alt.values, (err, result) => {
        if (err) {
            form.output.status = 0;
            form.output.descript = "พบข้อผิดพลาดบางอย่าง!";
            form.output.error = err;
            form.output.data = [];
            
            return res.json(form.output);
        }

        if (result.length > 0) {
            reorganize(input.url.available, result, (items) => {
                form.output.status = 1;
                form.output.descript = "พบข้อมูลแล้ว " + items.length + " รายการ";
                form.output.data = items;

                return res.json(form.output);
            });
        } else {
            form.output.status = 0;
            form.output.descript = "ไม่พบข้อมูล!";
            form.output.data = [];

            return res.json(form.output);
        }
    });
});

module.exports = router;