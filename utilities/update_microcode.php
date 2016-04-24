<?php

include_once "instructor_password_hash.php";

$rest_json = file_get_contents("php://input");
$_POST = json_decode($rest_json, true);

$hashed_token = hash("sha256", $_POST["password"]);

// this uses a very strict regex to make sure that even someone with the instructor password can only save
// a very specific format of information to the server.
// it is used by the instructor page to safely change visible instructions

if (!preg_match('/MICROCODE\s?=\s?\[(\s?\[((("[A-Z]{0,20}[0-9]?")|([0-9]{1,2}))\s?\,?\s?){19}\]\s?\,?\s?){30}\];/',
        $_POST["microcode"]) > 0) {
    $response = array(
        "status" => "fail",
        "message" => "Bad microcode"
    );
} else if ($hashed_token == $INSTRUCTOR_PASSWORD_HASH) {
    file_put_contents("../secure_content/microcode.js", $_POST["microcode"]);
} else {
    $response = array(
        "status" => "fail",
        "message" => "Invalid password"
    );
}

echo json_encode($response);