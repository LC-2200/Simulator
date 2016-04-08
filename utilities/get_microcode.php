<?php

include_once "instructor_password_hash.php";

$rest_json = file_get_contents("php://input");
$_POST = json_decode($rest_json, true);

$hashed_token = hash("sha256", $_POST["password"]);

if ($hashed_token == $INSTRUCTOR_PASSWORD_HASH) {
    $response = array(
        "microcode" => file_get_contents("../secure_content/microcode.js")
    );
} else {
    $response = array(
        "status" => "fail"
    );
}

echo json_encode($response);