import Car from "./Car.js";

export default class Cars {
  constructor() {
    this.ceste = [];
    this.cars = [];
    this.start();
  }

  start() {
    let car = new Car();
    this.cars.push(car);
  }

  deleteCars() {}
}
