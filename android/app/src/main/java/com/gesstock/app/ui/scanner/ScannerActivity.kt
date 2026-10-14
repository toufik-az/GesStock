package com.gesstock.app.ui.scanner

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.OptIn
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import com.gesstock.app.R
import com.gesstock.app.databinding.ActivityScannerBinding
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.Executors

class ScannerActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_CODE = "code"
    }

    private lateinit var binding: ActivityScannerBinding
    private val executor = Executors.newSingleThreadExecutor()
    private val scanner: BarcodeScanner by lazy { BarcodeScanning.getClient() }
    private var trouve = false

    private val demandePermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { accorde ->
            if (accorde) {
                demarrerCamera()
            } else {
                Toast.makeText(this, R.string.permission_camera_refusee, Toast.LENGTH_LONG).show()
                finish()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScannerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            demarrerCamera()
        } else {
            demandePermission.launch(Manifest.permission.CAMERA)
        }
    }

    private fun demarrerCamera() {
        val futur = ProcessCameraProvider.getInstance(this)
        futur.addListener({
            val provider = futur.get()
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.previewView.surfaceProvider)
            }
            val analyse = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
            analyse.setAnalyzer(executor) { proxy -> analyser(proxy) }
            provider.unbindAll()
            provider.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, preview, analyse)
        }, ContextCompat.getMainExecutor(this))
    }

    @OptIn(ExperimentalGetImage::class)
    private fun analyser(proxy: ImageProxy) {
        val image = proxy.image

        if (image == null || trouve) {
            proxy.close()
            return
        }

        scanner.process(InputImage.fromMediaImage(image, proxy.imageInfo.rotationDegrees))
            .addOnSuccessListener { codes ->
                val valeur = codes.firstOrNull()?.rawValue
                if (valeur != null && !trouve) {
                    trouve = true
                    setResult(RESULT_OK, Intent().putExtra(EXTRA_CODE, valeur))
                    finish()
                }
            }
            .addOnCompleteListener { proxy.close() }
    }

    override fun onDestroy() {
        super.onDestroy()
        executor.shutdown()
    }
}
