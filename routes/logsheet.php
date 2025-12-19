<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Logsheet\InspectionLogsheetController;
use App\Http\Controllers\Logsheet\LogsheetListController;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {
  // Package Type
  Route::get("/inspection/logsheet/index", [InspectionLogsheetController::class, 'index'])->name('inspection.logsheet.index');

  Route::post("/inspection/logsheet/add", [InspectionLogsheetController::class, 'addingses'])->name('inspection-logsheet.add');

  Route::post('/inspection/logsheet/mass-insert', [InspectionLogsheetController::class, 'massInsert'])->name('inspection-logsheet.mass-insert');

  Route::put('/logsheets/update/{id}', [InspectionLogsheetController::class, 'editseses'])->name('logsheets.update');

  Route::post('/logsheets/check-exists', [InspectionLogsheetController::class, 'checkExists'])->name('inspection-logsheet.check-exists');

  Route::delete('/logsheets/delete/{id}', [InspectionLogsheetController::class, 'removingses'])->name('logsheet.delete');

  Route::get('/inspection/logsheet/list', [LogsheetListController::class, 'index'])->name('inspection.logsheet.list');

  Route::put('/monitoring/logsheets/update/{id}', [LogsheetListController::class, 'editseses'])->name('monitoring.logsheets.update');
});
