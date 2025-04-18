
document.addEventListener("DOMContentLoaded", function() {
    const button = document.getElementById("idButton");
    const input = document.getElementById("idInput");
    const id = document.getElementById("id");

    button.addEventListener("click", function() {
        id.textContent = input.value;
        document.getElementById("id").textContent = value;
    });
});