export default class Car {
  constructor(direction, speed, xPosition) {
    this.direction = direction;
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
    if (yPos * 2 < this.yPosition + 0.7 && yPos * 2 > this.yPosition - 0.7) {
      // če avto prekriva del možička je možiček zadet
      return true;
    }
  }

  isClose(yPos) {
    // če je avto blizu možička
    if (yPos * 2 < this.yPosition + 1.2 && yPos * 2 > this.yPosition - 1.2) {
      return true;
      // da auto piska samo če se mu približaš od odspredaj (ne deluje pravilno):
      // if (this.direction < 0 && yPos < this.yPosition) // auti z desne
      //   return true;
      // if (this.direction > 0  && yPos > this.yPosition) // auti z leve
      //   return true;
    }
  }
}
