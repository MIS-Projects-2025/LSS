<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Maintenance\PackageTypeController;
use App\Http\Controllers\Maintenance\StampController;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::middleware(AdminMiddleware::class)->group(function () {

    // Package Type
    Route::get("/package-type/index", [PackageTypeController::class, 'index'])->name('package-type.index');
    Route::post("/package-type/store", [PackageTypeController::class, 'insertiningses'])->name('package-type.store');
    Route::put('/package-type/update/{id}', [PackageTypeController::class, 'updatingses'])->name('package-type.update');
    Route::delete('/package-type/delete/{id}', [PackageTypeController::class, 'removeingses'])->name('package-type.delete');


    // Stamp
    Route::get("/stamp/index", [StampController::class, 'index'])->name('stamp.index');
    Route::post("/stamp/store", [StampController::class, 'addingses'])->name('stamp.add');
    Route::put('/stamp/update/{id}', [StampController::class, 'updatingses'])->name('stamp.update');
    Route::delete('/stamp/delete/{id}', [StampController::class, 'deletingses'])->name('stamp.delete');
  });
});
