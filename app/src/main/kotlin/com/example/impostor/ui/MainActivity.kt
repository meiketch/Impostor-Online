package com.example.impostor.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.impostor.R
import com.example.impostor.data.GameRepository
import com.example.impostor.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var playerSetupFragment: PlayerSetupFragment

    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        requestPermissions()
        
        if (savedInstanceState == null) {
            showPlayerSetup()
        }
    }

    private fun requestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_CONTACTS
        )
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.READ_PHONE_NUMBERS)
        }
        
        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()
        
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsToRequest, PERMISSION_REQUEST_CODE)
        }
    }

    private fun showPlayerSetup() {
        playerSetupFragment = PlayerSetupFragment()
        playerSetupFragment.setOnGameStartedListener { impostorCount ->
            showGameStarting(impostorCount)
        }
        
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, playerSetupFragment)
            .addToBackStack(null)
            .commit()
    }

    fun showWordList() {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, WordListFragment())
            .addToBackStack(null)
            .commit()
    }

    private fun showGameStarting(impostorCount: Int) {
        val gameStartingFragment = GameStartingFragment()
        gameStartingFragment.arguments = Bundle().apply {
            putInt("impostor_count", impostorCount)
        }
        gameStartingFragment.setOnGameReadyListener {
            showGamePlaying()
        }
        
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, gameStartingFragment)
            .addToBackStack(null)
            .commit()
    }

    private fun showGamePlaying() {
        val gamePlayingFragment = GamePlayingFragment()
        gamePlayingFragment.setOnGameEndedListener {
            showPlayerSetup()
        }
        gamePlayingFragment.setOnNewRoundListener {
            val repository = GameRepository(this)
            showGameStarting(repository.getLastImpostorCount())
        }
        
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, gamePlayingFragment)
            .addToBackStack(null)
            .commit()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            for ((index, permission) in permissions.withIndex()) {
                if (grantResults[index] != PackageManager.PERMISSION_GRANTED) {
                    // Permission denied
                    android.widget.Toast.makeText(
                        this,
                        "Erforderliche Berechtigung wurde verweigert: $permission",
                        android.widget.Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
}
