package com.example.impostor.ui

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.ContactsContract
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import com.example.impostor.R
import com.example.impostor.data.GameLogic
import com.example.impostor.data.GameRepository
import com.example.impostor.data.Player
import com.example.impostor.databinding.FragmentPlayerSetupBinding
import java.util.UUID

class PlayerSetupFragment : Fragment() {

    private lateinit var binding: FragmentPlayerSetupBinding
    private lateinit var gameRepository: GameRepository
    private lateinit var adapter: PlayerAdapter
    private val players = mutableListOf<Player>()
    private var onGameStarted: ((impostorCount: Int) -> Unit)? = null

    private val pickContactLauncher = registerForActivityResult(
        ActivityResultContracts.PickContact()
    ) { uri: Uri? ->
        uri?.let { importContact(it) }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        binding = FragmentPlayerSetupBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        gameRepository = GameRepository(requireContext())
        
        setupAdapter()
        setupImpostorSelector()
        setupButtons()
        loadPlayers()
    }

    private fun setupAdapter() {
        adapter = PlayerAdapter(players) { player ->
            gameRepository.removePlayer(player.phoneNumber)
            loadPlayers()
        }
        binding.playersRecyclerView.adapter = adapter
    }

    private fun setupImpostorSelector() {
        val lastCount = gameRepository.getLastImpostorCount()
        binding.impostorCountDisplay.text = lastCount.toString()
        
        binding.decreaseImpostorBtn.setOnClickListener {
            val current = binding.impostorCountDisplay.text.toString().toInt()
            if (current > 1) {
                val next = current - 1
                binding.impostorCountDisplay.text = next.toString()
                gameRepository.saveLastImpostorCount(next)
            }
        }
        
        binding.increaseImpostorBtn.setOnClickListener {
            val current = binding.impostorCountDisplay.text.toString().toInt()
            val max = maxOf(1, players.size - 1)
            if (current < max) {
                val next = current + 1
                binding.impostorCountDisplay.text = next.toString()
                gameRepository.saveLastImpostorCount(next)
            }
        }
    }

    private fun setupButtons() {
        binding.addPlayerBtn.setOnClickListener { addPlayer() }
        binding.importContactsBtn.setOnClickListener { importContacts() }
        binding.clearAllBtn.setOnClickListener { clearAllPlayers() }
        binding.startGameBtn.setOnClickListener { startGame() }
        binding.manageWordsBtn.setOnClickListener {
            (activity as? MainActivity)?.showWordList()
        }
    }

    private fun loadPlayers() {
        players.clear()
        players.addAll(gameRepository.getPlayers())
        adapter.notifyDataSetChanged()
        updateUI()
    }

    private fun addPlayer() {
        val name = binding.playerNameInput.text.toString().trim()
        val phone = binding.phoneNumberInput.text.toString().trim()

        if (name.isEmpty() || phone.isEmpty()) {
            android.widget.Toast.makeText(
                requireContext(),
                "Bitte Name und Telefon eingeben",
                android.widget.Toast.LENGTH_SHORT
            ).show()
            return
        }

        val player = Player(UUID.randomUUID().toString(), name, phone)
        gameRepository.addPlayer(player)
        
        binding.playerNameInput.text.clear()
        binding.phoneNumberInput.text.clear()
        
        loadPlayers()
    }

    private fun importContacts() {
        pickContactLauncher.launch(null)
    }

    private fun importContact(uri: Uri) {
        try {
            val cursor = requireContext().contentResolver.query(
                uri,
                arrayOf(ContactsContract.Contacts.DISPLAY_NAME, 
                        ContactsContract.Contacts._ID),
                null, null, null
            )
            
            cursor?.use {
                if (it.moveToFirst()) {
                    val nameIndex = it.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME)
                    val idIndex = it.getColumnIndex(ContactsContract.Contacts._ID)
                    
                    val name = it.getString(nameIndex)
                    val id = it.getString(idIndex)
                    
                    // Telefonnummer auslesen
                    val phoneCursor = requireContext().contentResolver.query(
                        ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                        arrayOf(ContactsContract.CommonDataKinds.Phone.NUMBER),
                        "${ContactsContract.CommonDataKinds.Phone.CONTACT_ID} = ?",
                        arrayOf(id),
                        null
                    )
                    
                    phoneCursor?.use { pc ->
                        if (pc.moveToFirst()) {
                            val phoneIndex = pc.getColumnIndex(
                                ContactsContract.CommonDataKinds.Phone.NUMBER
                            )
                            val phone = pc.getString(phoneIndex)
                            
                            val player = Player(UUID.randomUUID().toString(), name, phone)
                            gameRepository.addPlayer(player)
                            loadPlayers()
                        }
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun clearAllPlayers() {
        val builder = androidx.appcompat.app.AlertDialog.Builder(requireContext())
        builder.setTitle("Alle Spieler löschen?")
        builder.setMessage("Dies kann nicht rückgängig gemacht werden.")
        builder.setPositiveButton("Ja") { _, _ ->
            gameRepository.savePlayers(emptyList())
            loadPlayers()
        }
        builder.setNegativeButton("Nein", null)
        builder.show()
    }

    private fun startGame() {
        val impostorCount = binding.impostorCountDisplay.text.toString().toInt()
        gameRepository.saveLastImpostorCount(impostorCount)
        onGameStarted?.invoke(impostorCount)
    }

    private fun updateUI() {
        binding.playersCountText.text = "Spieler: ${players.size}"
        binding.startGameBtn.isEnabled = players.size >= 3
        
        val maxImpostors = maxOf(1, players.size - 1)
        val currentCount = binding.impostorCountDisplay.text.toString().toIntOrNull() ?: gameRepository.getLastImpostorCount()
        
        if (currentCount > maxImpostors) {
            binding.impostorCountDisplay.text = maxImpostors.toString()
            gameRepository.saveLastImpostorCount(maxImpostors)
        }
    }

    fun setOnGameStartedListener(listener: (Int) -> Unit) {
        this.onGameStarted = listener
    }
}
