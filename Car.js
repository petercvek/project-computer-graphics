export default class Car {
  constructor(direction, speed, xPosition) {
    this.xPosition = xPosition;
    this.yPosition = -10 * direction;
    this.moveCar(speed, direction);
  }

  moveCar(speed, direction) {
    new Between(-10 * direction, -15 * -direction).time(speed * 1500).on("update", value => {
      this.yPosition = value;
    });
  }

  isHit(yPos) {
    if (yPos * 2 < this.yPosition + 0.7 && yPos * 2 > this.yPosition - 0.7)
      // če avto prekriva del možička je možiček zadet
      return true;
  }
}
