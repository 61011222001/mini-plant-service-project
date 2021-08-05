const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    const form = env.form(__dirname + '/form.json');
    const input = env.input(req);

    const vat = env.validate(input.body, ["pr_detail", "pr_imgURL"]);

    if (vat.valid) {
        let sql = "INSERT INTO products "
            + "(pr_name, pr_detail, pr_type, pr_size, pr_price, pr_status, pr_imgsURL) "
            + "VALUES ?";

        let values = [[
            input.body.pr_name,
            input.body.pr_detail,
            input.body.pr_type,
            JSON.stringify(input.body.pr_size == null ? [] : input.body.pr_size),
            input.body.pr_price, 
            input.body.pr_status,
            JSON.stringify(input.body.pr_imgsURL == null ? [] : input.body.pr_imgsURL)
        ]];
        
        env.database.query(sql, [values], (err, result) => {
            if (err) {
                form.output.status = 0;
                form.output.descript = 'บันทึกข้อมูลไม่สำเร็จ';
                form.output.error = err;
                form.output.data = [];

                return res.json(form.output);
            }

            if (result.affectedRows > 0) {
                env.get("/product?id=*", [result.insertId], (r) => {
                    form.output.status = 1;
                    form.output.descript = 'บันทึกข้อมูสำเร็จแล้ว';
                    form.output.error = null;
                    form.output.data = r.data[0];

                    return res.json(form.output);
                });
            } else {
                form.output.status = 0;
                form.output.descript = 'บันทึกข้อมูลไม่สำเร็จ';
                form.output.error = null;
                form.output.data = [];

                return res.json(form.output);
            }
        });
    } else {
        form.output.status = 0;
        form.output.descript = vat.message;
        form.output.error = null;
        form.output.data = [];

        return res.json(form.output);
    }
});

module.exports = router;