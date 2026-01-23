import Seat from "../models/Seat.js";

export async function generateShowSeats(showId, rows, columns) {
  if (!showId || !rows || !columns) {
    throw new Error("Invalid seat generation parameters");
  }

  const seats = [];

  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= columns; c++) {
      seats.push({
        show_id: showId,
        row: r,
        column: c,
        status: "available", // مهم جداً
      });
    }
  }

  await Seat.insertMany(seats);

  return seats.length;
}
