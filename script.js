
document.addEventListener("DOMContentLoaded", function() {
    const button = document.getElementById("myButton");
    const input = document.getElementById("myInput");
    const result = document.getElementById("result");

    button.addEventListener("click", function() {
        result.textContent = input.value;
        document.getElementById("id").textContent = value;
    });
});