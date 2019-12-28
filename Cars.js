import Car from "./Car.js";

export default class Cars {
  constructor(xPosition) {
    this.cars = [];
    this.start(xPosition);
  }

  start(xPosition) {
    // random smer, random speed, random razlika med avti
    let directions = [-1, 1];
    this.direction = directions[Math.floor(Math.random() * 2)];

    this.speed = Math.floor(Math.random() * 7 + 3);
    this.waitTime = Math.floor(Math.random() * 3000 + 2000);

    // takoj enga das v sceno
    let car = new Car(this.direction, this.speed, xPosition);
    this.cars.push(car);

    // nato pa se ponavlja na waitTime
    setInterval(() => {
      let car = new Car(this.direction, this.speed, xPosition);
      this.cars.push(car);
      this.deleteCars();
      //   console.log(this.cars);
    }, this.waitTime);
  }

  deleteCars() {
    // pogleda ce je avto izven zaslona
    this.cars = this.cars.filter(car => car.yPosition < 15 && car.yPosition > -15);
  }
}
