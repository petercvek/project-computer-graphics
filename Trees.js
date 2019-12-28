export default class Trees {
  constructor() {
    this.map = Array.from({ length: 1 }, () => []);
    this.map[0] = [1, 1, 1, 1, 1, 1, 1, 1, 1];
    this.map[1] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 20; i++) this.nextLine();
  }

  nextLine() {
    let len = this.map.length;
    if (this.isTreeLine(this.map[len - 2])) {
      // če je pred prejšnja napolnjena z drevesi doda eno prazno
      this.map[len] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    } else {
      let n_trees = Math.floor(Math.random() * 4) + 2; // število dreves naključno med 2-5
      let next = Array.from(Array(9), () => 0); // napolni z ničlami
      for (
        let i = 0;
        i < n_trees;
        i++ // začetek tabele napolni z n_trees enkami
      )
        next[i] = 1;
      while (true) {
        // shufla dokler ni vsaj ene proste poti med trenutno in prejšnjo
        next = this.shuffle(next);
        for (let i = 0; i < next.length; i++) {
          if (this.map[len - 1][i] === 0 && next[i] === 0) {
            // če sta na istem indeksu obe 0 obstaja pot
            this.map[len] = next;
            return;
          }
        }
      }
    }
  }

  shuffle(array) {
    let currentIndex = array.length,
      temporaryValue,
      randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // swap:
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  isTreeLine(array) {
    for (let i = 0; i < array.length; i++) if (array[i] === 1) return true;
    return false;
  }
}
