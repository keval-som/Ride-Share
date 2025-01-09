(function ($) {
  $(document).ready(function () {
    const carTypeSeats = {
      Sedan: 4,
      SUV: 6,
      Minivan: 7,
    };

    document.getElementById("ridePostDate").min = new Date()
      .toISOString()
      .split("T")[0];

    let origin = document.getElementById("ridePostOrigin");

    $("#ridePostOrigin").change(function () {
      const origin = document.getElementById("ridePostOrigin").value;
      const destination = document.getElementById("ridePostDestination");
      Array.from(destination.options).forEach((option) => {
        if (option.value === origin) {
          option.disabled = true;
        } else {
          option.disabled = false;
        }
      });
    });
    let destination = document.getElementById("ridePostDestination");

    $("#ridePostDestination").change(function () {
      const destination = document.getElementById("ridePostDestination").value;
      const origin = document.getElementById("ridePostOrigin");
      Array.from(origin.options).forEach((option) => {
        if (option.value === destination) {
          option.disabled = true;
        } else {
          option.disabled = false;
        }
      });
    });

    let carType = document.getElementById("carType");

    $("#carType").change(function () {
      const carType = document.getElementById("carType").value;
      const seatSelect = document.getElementById("ridePostSeats");
      seatSelect.innerHTML = "";

      if (carTypeSeats[carType]) {
        for (let i = 1; i < carTypeSeats[carType]; i++) {
          const option = document.createElement("option");
          option.value = i;
          option.textContent = `${i} Seat${i > 1 ? "s" : ""}`;
          seatSelect.appendChild(option);
        }
      }
    });

    $("#recommendPrice").click(function () {
      $("#error").hide();
      const origin = $("#ridePostOrigin").val();
      const destination = $("#ridePostDestination").val();
      const carType = $("#carType").val();
      const seatsAvailable = $("#ridePostSeats").val();
      const price = $("#ridePostAmount");

      if (!origin || !destination) {
        $("#error")
          .text(
            "Please enter both start and end locations to get a recommended price."
          )
          .show();
        return;
      }
      if (!carType) {
        $("#error")
          .text("Please select a car type to get a recommended price.")
          .show();
        return;
      }
      if (
        !seatsAvailable ||
        seatsAvailable < 1 ||
        !Number.isInteger(Number(seatsAvailable))
      ) {
        $("#error")
          .text(
            "Please enter the number of seats available to get a recommended price."
          )
          .show();
        return;
      }

      const gasPrices = new Map([
        ["Boston", 3.034],
        ["New York City", 2.953],
        ["Hoboken", 2.953],
      ]);
      const carMileage = new Map([
        ["Sedan", 31],
        ["SUV", 29],
        ["Truck", 20],
      ]);
      const distances = new Map([
        ["Hoboken - New York City", 9],
        ["Hoboken - Boston", 218],
        ["New York City - Boston", 209],
      ]);

      if (!gasPrices.has(origin) || !gasPrices.has(destination)) {
        $("#error")
          .text(
            "Please enter valid start and end locations to get a recommended price."
          )
          .show();
        return;
      }

      if (!carMileage.has(carType)) {
        $("#error")
          .text("Please enter a valid car type to get a recommended price.")
          .show();
        return;
      }
      let distanceKey = `${origin} - ${destination}`;
      if (!distances.has(distanceKey)) {
        distanceKey = `${destination} - ${origin}`;
        if (!distances.has(distanceKey)) {
          $("#error")
            .text("Distance between the specified locations is not available.")
            .show();
          return;
        }
      }

      let distance = distances.get(distanceKey);
      let gasPrice = gasPrices.get(origin);
      let mileage = carMileage.get(carType);
      let averagePrice = (distance / mileage) * gasPrice;
      let pricePerSeat = averagePrice / seatsAvailable + 1;
      price.val(Math.round(pricePerSeat));
    });

    $("#ridePostForm")
      .submit(function (event) {
        event.preventDefault();
        const formData = {
          origin: $("#ridePostOrigin").val(),
          destination: $("#ridePostDestination").val(),
          date: $("#ridePostDate").val(),
          time: $("#ridePostTime").val(),
          seats: $("#ridePostSeats").val(),
          amount: $("#ridePostAmount").val(),
          carType: $("#carType").val(),
          description: $("#ridePostDescription").val(),
        };

        $.ajax({
          type: "POST",
          url: "/ridePost/post",
          data: formData,
          success: function () {
            alert("Ride posted successfully!");
            window.location.href = "/dashboard";
          },
          error: function () {
            $("#error")
              .text(
                "An error occurred while posting the ride. Please try again."
              )
              .show();
          },
        });
      });
  });

  let verifyLicenseForm = $("#verifyLicenseForm");
  verifyLicenseForm.submit(function (event) {
    event.preventDefault();

    const license = document.getElementById("license").value;
    const licenseImg = document.getElementById("licenseImg").files[0];

    if (!license || license.trim().length === 0) {
      alert("License number is required.");
      return;
    }

    if (!licenseImg) {
      alert("License image is required.");
      return;
    }

    const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
    if (!allowedExtensions.exec(licenseImg.name)) {
      alert(
        "Invalid file type. Please upload an image file (jpg, jpeg, png, gif)."
      );
      return;
    }

    let formData = new FormData();
    formData.append("license", license);
    formData.append("licenseImg", licenseImg);

    $.ajax({
      type: "POST",
      url: "/verify",
      data: formData,
      processData: false,
      contentType: false,
      success: function (response) {
        window.location.href = "/ridePost";
      },
      error: function (_, __, errorThrown) {
        alert("Error: " + errorThrown);
      },
    });
  });
})(jQuery);
