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

    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        requestPermissions()
        if (savedInstanceState == null) showPlayerSetup()
    }

    private fun requestPermissions() {
        val permissions = mutableListOf(Manifest.permission.SEND_SMS, Manifest.permission.READ_CONTACTS)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) permissions.add(Manifest.permission.READ_PHONE_NUMBERS)
        val toRequest = permissions.filter { ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED }
        if (toRequest.isNotEmpty()) ActivityCompat.requestPermissions(this, toRequest.toTypedArray(), PERMISSION_REQUEST_CODE)
    }

    fun showPlayerSetup() {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, PlayerSetupFragment())
            .commit()
    }

    fun showWordList() {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, WordListFragment())
            .addToBackStack(null)
            .commit()
    }

    fun showDetectiveItems() {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, DetectiveItemsFragment())
            .addToBackStack(null)
            .commit()
    }

    fun showRules() {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, RulesFragment())
            .addToBackStack(null)
            .commit()
    }

    fun showGameStarting(imp: Int, jester: Int, det: Int, items: Int, doppel: Int) {
        val fragment = GameStartingFragment().apply {
            arguments = Bundle().apply {
                putInt("impostor_count", imp)
                putInt("jester_count", jester)
                putInt("detective_count", det)
                putInt("det_items_count", items)
                putInt("doppel_max", doppel)
            }
            setOnGameReadyListener { showGamePlaying() }
        }
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .addToBackStack(null)
            .commit()
    }

    private fun showGamePlaying() {
        val fragment = GamePlayingFragment().apply {
            setOnGameEndedListener { showPlayerSetup() }
            setOnNewRoundListener {
                val repo = GameRepository(this@MainActivity)
                showGameStarting(
                    repo.getLastImpostorCount(), 
                    repo.getLastJesterCount(), 
                    repo.getLastDetectiveCount(), 
                    repo.getLastDetItemsCount(),
                    repo.getLastDoppelgangerMaxCount()
                )
            }
        }
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .addToBackStack(null)
            .commit()
    }
}
