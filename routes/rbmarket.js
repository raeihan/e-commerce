var express = require("express");
var router = express.Router();
const fs = require("fs");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

var connection = require("../config/database");

router.get("/detail/:id", (req, res) => {
  connection.query(
    `SELECT * FROM home WHERE id = ${req.params.id}`,
    function (err, rows) {
      if (err) {
        res.redirect("/");
      } else {
        if (rows.length > 0) {
          const sendData = {
            nama: rows[0].nama,
            harga: rows[0].harga,
            jenis: rows[0].jenis,
            description: rows[0].description,
            gambar: rows[0].gambar,
          };
          res.render("detail", { data: sendData });
        } else {
          res.send("Data not found");
        }
      }
    }
  );
});

router.get("/", (req, res) => {
  var getData = "SELECT * FROM home ORDER BY id desc";

  connection.query(getData, function (err, rows) {
    if (err) {
      req.flash("Error", err);
      res.render("", {
        username: req.session.username,
        role: req.session.role,
        data: "",
      });
    } else {
      res.render("rbmarket", {
        username: req.session.username,
        role: req.session.role,
        data: rows,
      });
    }
  });
});

router.get("/foods", (req, res) => {
  var getDataFood = 'SELECT * FROM home WHERE jenis = "Makanan"';

  connection.query(getDataFood, function (err, rows) {
    if (err) {
      req.flash("Error", err);
      res.render("", {
        username: req.session.username,
        role: req.session.role,
        data: "",
      });
    } else {
      res.render("rbmarket", {
        username: req.session.username,
        role: req.session.role,
        data: rows,
      });
    }
  });
});

router.get("/drinks", (req, res) => {
  var getDataDrink = 'SELECT * FROM home WHERE jenis = "Minuman"';

  connection.query(getDataDrink, function (err, rows) {
    if (err) {
      req.flash("Error", err);
      res.render("", {
        username: req.session.username,
        role: req.session.role,
        data: "",
      });
    } else {
      res.render("rbmarket", {
        username: req.session.username,
        role: req.session.role,
        data: rows,
      });
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

router.get("/create", function (req, res, next) {
  res.render("create", {
    nama: "",
    jenis: "",
    harga: "",
    description: "",
    gambar: "",
  });
});

router.post(
  "/store",
  upload.single("gambar"),
  function (req, res, next) {
    let nama = req.body.nama;
    let jenis = req.body.jenis;
    let harga = req.body.harga;
    let description = req.body.description;

    let gambar = req.file.originalname;

    let error = false;

    if (
      nama.length === 0 ||
      jenis.length === 0 ||
      harga.length === 0 ||
      description.length === 0
    ) {
      error = true;

      req.flash("error", "Please Input Correctly");
      res.render("create", {
        nama: nama,
        jenis: jenis,
        harga: harga,
        description: description,
        gambar: gambar,
      });
    }

    if (!error) {
      let formData = {
        nama: nama,
        jenis: jenis,
        harga: harga,
        description: description,
        gambar: gambar,
      };

      connection.query(
        "INSERT INTO home SET ?",
        formData,
        function (err, results) {
          if (err) {
            req.flash("error", err);

            res.render("create", {
              nama: formData.nama,
              jenis: formData.jenis,
              harga: formData.harga,
              description: formData.description,
              gambar: formData.gambar,
            });
          } else {
            req.flash("Success", "Added Data Successfully!");
            res.redirect("/");
          }
        }
      );
    }
  }
);

router.get("/edit/:id", function (req, res, next) {
  connection.query(
    `SELECT * FROM home WHERE id = ${req.params.id}`,
    function (err, rows) {
      if (err) throw err;

      if (rows.length <= 0) {
        req.flash("error", `Menu with ID ${req.params.id} Not Found`);
        res.redirect("/");
      } else {
        res.render("edit", {
          id: rows[0].id,
          nama: rows[0].nama,
          jenis: rows[0].jenis,
          harga: rows[0].harga,
          description: rows[0].description,
          gambar: rows[0].gambar,
        });
      }
    }
  );
});

router.post(
  "/update/:id",
  upload.single("gambar"),
  function (req, res, next) {
    let nama = req.body.nama;
    let jenis = req.body.jenis;
    let harga = req.body.harga;
    let description = req.body.description;

    let error = false;

    if (
      nama.length === 0 ||
      jenis.length === 0 ||
      harga.length === 0 ||
      description.length === 0
    ) {
      error = true;

      req.flash("error", "Please Input Data");

      res.render("edit", {
        nama: nama,
        jenis: jenis,
        harga: harga,
        description: description,
      });
    }

    if (!error) {
      connection.query(
        `SELECT gambar FROM home WHERE id = ${req.params.id}`,
        function (err, results) {
          if (err) {
            req.flash("error", err);
            res.render("edit", {
              nama: nama,
              jenis: jenis,
              harga: harga,
              description: description,
            });
          } else {
            let previousImage = results[0].gambar;

            if (previousImage) {
              fs.unlinkSync(`public/images/${previousImage}`);
            }

            let formData = {
              nama: nama,
              jenis: jenis,
              harga: harga,
              description: description,
            };

            if (req.file) {
              formData.gambar = req.file.originalname;
            }

            connection.query(
              `UPDATE home SET ? WHERE id = ${req.params.id}`, formData,
              function (err) {
                if (err) {
                  req.flash("error", err);
                  res.render("edit", {
                    nama: formData.nama,
                    jenis: formData.jenis,
                    harga: formData.harga,
                    description: formData.description,
                    gambar: formData.gambar
                  });
                } else {
                  req.flash("success", "Update Data Successfully");
                  res.redirect(`/`);
                }
              }
            );
          }
        }
      );
    }
  }
);

router.get('/delete/:idData', function(req, res) {
  let idData = req.params.idData

  connection.query(`SELECT gambar FROM home WHERE id = ${idData}`, function(error, results) {
    if(error) {
      req.flash('error', error);
      res.redirect(`/`);
    }else {
      let deleteImage = results[0].gambar
      if(deleteImage) fs.unlinkSync('public/images/' + deleteImage);

      connection.query(`DELETE FROM home WHERE id = ${idData}`, function(error, results) {
        if(error) {
          req.flash('error', error);
          res.redirect(`/`);
        }else {
          req.flash('Success', 'Data deleted');
          res.redirect(`/`);
        }
      });
    }
  });
});

module.exports = router;
