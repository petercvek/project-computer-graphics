export default class Car {
  constructor() {
    this.position = 2;
    this.moveCar(3);
  }

  moveCar(speed) {
    setInterval(() => {
      this.position += 0.01 * speed;
    }, 20);
  }
}
