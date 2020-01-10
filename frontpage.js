// javascript file za front page igre
// box-shadow on active element:
function activeCharacter(active = 1) {
    if (active === 1)
        active = "penguin";
    else
        active = "vampire";
    let id = active==="penguin" ? "leftImg":"rightImg";
    let remove = active==="vampire" ? "leftImg":"rightImg";
    document.getElementById(id).style.boxShadow = "inset 0 0 30px black";
    document.getElementById(id).style.borderRadius = "20px";
    document.getElementById(remove).style.boxShadow = "";
    document.getElementById(remove).style.borderRadius = "";
    return active;
}