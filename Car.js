export default class Car {
  constructor(direction, speed, xPosition) {
    this.xPosition = xPosition;
    this.yPosition = -10 * direction;
    this.moveCar(speed, direction);
  }

  moveCar(speed, direction) {
    setInterval(() => {
      this.yPosition += 0.01 * speed * direction;
    }, 20);
  }
}
