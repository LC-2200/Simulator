function on_instructor_load() {
    select("id","options_save").js_object.addEventListener("click", function() {
        alert("Options saved.");
    });
}

setTimeout(function() {
    on_instructor_load();
}, 1000);