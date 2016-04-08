<?php

include_once "student_password_hash.php";
include_once "instructor_password_hash.php";

$rest_json = file_get_contents("php://input");
$_POST = json_decode($rest_json, true);

$hashed_token = hash("sha256", $_POST["password"]);

if ($hashed_token == $STUDENT_PASSWORD_HASH) {
    $response = array(
        "status" => "student",
        "html" => file_get_contents("../secure_content/student.html"),
        "javascript" => file_get_contents("../secure_content/student.js"),
        "microcode" => file_get_contents("../secure_content/microcode.js")
    );
} else if ($hashed_token == $INSTRUCTOR_PASSWORD_HASH) {
    $response = array(
        "status" => "instructor",
        "html" => file_get_contents("../secure_content/instructor.html"),
        "javascript" => file_get_contents("../secure_content/instructor.js")
    );
} else {
    $response = array(
        "status" => "fail"
    );
}

echo json_encode($response);