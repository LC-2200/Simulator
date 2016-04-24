var student_password_success = false;
var microstates_success = false;
var update_instructor_password = false;
var instructor_password_1;

// called by login.js after dom content is loaded
function on_instructor_load() {
    post("./utilities/get_microcode.php", {password: password}, true, function(response) {
        // password sanity check
        if (response.status == "fail") {
            alert("Invalid password", "Oops!");
            return;
        }

        // recalling the current state of microcode availability
        var instructions = ["ADD", "NAND", "LW", "SW", "ADDI", "JALR", "BEQ"];
        for (var i = 0; i < instructions.length; i++) {
            if (response.microcode.indexOf(instructions[i]) != -1) {
                select("id", instructions[i].toLocaleLowerCase() + "_box").js_object.setAttribute("checked", "true");
            }
        }
    });

    // binding the save button to the save process
    select("id","options_save").js_object.addEventListener("click", function() {
        var student_password_1 = select("id","student_password_1").js_object.value;
        var student_password_2 = select("id","student_password_2").js_object.value;
        instructor_password_1 = select("id","instructor_password_1").js_object.value;
        var instructor_password_2 = select("id","instructor_password_2").js_object.value;

        var update_student_password = false;

        // input checking:
        if (student_password_1 != "") {
            if (student_password_1 != student_password_2) {
                alert("Student passwords do not match.", "Oops!");
                return;
            } else {
                update_student_password = true;
            }
        }

        if (instructor_password_1 != "") {
            if (instructor_password_1 != instructor_password_2) {
                alert("Instructor passwords do not match.", "Oops!");
                return;
            } else {
                update_instructor_password = true;
            }
        }

        if (update_student_password) {
            post("./utilities/update_student_password.php", {
                password: password,
                new_student_password: student_password_1
            }, true, function() {
                student_password_success = true;
                final();
            });
        } else {
            student_password_success = true;
        }

        // building new microcode variable based on latest settings
        var new_microcode = "MICROCODE = [[\"FETCH0\", 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], " +
                                         "[\"FETCH1\", 2, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], " +
                                         "[\"FETCH2\", 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 3, 1, 0],";

        if (select("id", "add_box").js_object.checked) {
            new_microcode += "[\"ADD0\", 4, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]," +
                "[\"ADD1\", 5, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0]," +
                "[\"ADD2\", 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],";
        } else {
            new_microcode += "[\"ERROR\", 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],";
        }

        if (select("id", "nand_box").js_object.checked) {
            new_microcode += "[\"NAND0\", 7, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]," +
                "[\"NAND1\", 8, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0]," +
                "[\"NAND2\", 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],";
        } else {
            new_microcode += "[\"ERROR\", 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],";
        }

        if (select("id", "addi_box").js_object.checked) {
            new_microcode += "[\"ADDI0\", 10, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]," +
                "[\"ADDI1\", 11, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ADDI2\", 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],";
        } else {
            new_microcode += "[\"ERROR\", 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],";
        }

        if (select("id", "lw_box").js_object.checked) {
            new_microcode += "[\"LW0\", 13, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]," +
                "[\"LW1\", 14, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"LW2\", 15, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"LW3\", 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],";
        } else {
            new_microcode += "[\"ERROR\", 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],";
        }

        if (select("id", "sw_box").js_object.checked) {
            new_microcode += "[\"SW0\", 17, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]," +
                "[\"SW1\", 18, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"SW2\", 19, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"SW3\", 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],";
        } else {
            new_microcode += "[\"ERROR\", 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],";
        }

        if (select("id", "beq_box").js_object.checked) {
            new_microcode += "[\"BEQ0\", 21, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"BEQ1\", 22, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]," +
                "[\"BEQ2\", 23, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0]," +
                "[\"BEQ3\", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]," +
                "[\"BEQ4\", 25, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"BEQ5\", 26, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"BEQ6\", 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],";
        } else {
            new_microcode += "[\"ERROR\", 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],";
        }

        if (select("id", "jalr_box").js_object.checked) {
            new_microcode += "[\"JALR0\", 28, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0]," +
                "[\"JALR1\", 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],";
        } else {
            new_microcode += "[\"ERROR\", 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]," +
                "[\"ERROR\", 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],";
        }

        new_microcode += "[\"HALT\", 29, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];";

        // sending the latest microcode to the server to be fetched by student pages
        post("./utilities/update_microcode.php", {password: password, microcode: new_microcode}, true, function(response) {
            if (response.status == "fail") {
                alert(response.message, "Error");
            } else {
                microstates_success = true;
                final();
            }
        });

        alert("Saving...");
        final();
    });
}

function final() {
    // updates the instructor password last to avoid authentication conflicts
    if (student_password_success && microstates_success) {
        if (update_instructor_password) {
            post("./utilities/update_instructor_password.php", {
                password: password,
                new_instructor_password: instructor_password_1
            }, true, function() {
                password = instructor_password_1;
                alert("Changes Saved.", "Success");
            });
        } else {
            alert("Changes Saved.", "Success");
        }
    }
}