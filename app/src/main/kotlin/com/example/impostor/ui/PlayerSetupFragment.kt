package com.example.impostor.ui

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.ContactsContract
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import com.example.impostor.data.Player
import com.example.impostor.data.GameRepository
import com.example.impostor.databinding.FragmentPlayerSetupBinding
import java.util.UUID

class PlayerSetupFragment : Fragment() {

    private lateinit var binding: FragmentPlayerSetupBinding
    private lateinit var gameRepository: GameRepository
    private lateinit var adapter: PlayerAdapter
    private val players = mutableListOf<Player>()

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
        binding.impostorCountDisplay.text = gameRepository.getLastImpostorCount().toString()
        binding.jesterCountDisplay.text = gameRepository.getLastJesterCount().toString()
        binding.detCountDisplay.text = gameRepository.getLastDetectiveCount().toString()
        binding.detItemsCountDisplay.text = gameRepository.getLastDetItemsCount().toString()
        binding.doppelCountDisplay.text = gameRepository.getLastDoppelgangerMaxCount().toString()
        
        setupCounter(binding.decreaseImpostorBtn, binding.increaseImpostorBtn, binding.impostorCountDisplay) { 
            gameRepository.saveLastImpostorCount(it) 
        }
        setupCounter(binding.decreaseJesterBtn, binding.increaseJesterBtn, binding.jesterCountDisplay, min = 0) { 
            gameRepository.saveLastJesterCount(it) 
        }
        setupCounter(binding.decreaseDetBtn, binding.increaseDetBtn, binding.detCountDisplay, min = 0) { 
            gameRepository.saveLastDetectiveCount(it) 
        }
        setupCounter(binding.decreaseDetItemsBtn, binding.increaseDetItemsBtn, binding.detItemsCountDisplay) { 
            gameRepository.saveLastDetItemsCount(it) 
        }
        setupCounter(binding.decreaseDoppelBtn, binding.increaseDoppelBtn, binding.doppelCountDisplay, min = 0) { 
            gameRepository.saveLastDoppelgangerMaxCount(it)
        }
    }

    private fun setupCounter(btnDec: View, btnInc: View, display: TextView, min: Int = 1, onUpdate: (Int) -> Unit) {
        btnDec.setOnClickListener {
            val current = display.text.toString().toInt()
            if (current > min) {
                val next = current - 1
                display.text = next.toString()
                onUpdate(next)
                updateUI()
            }
        }
        btnInc.setOnClickListener {
            val current = display.text.toString().toInt()
            val next = current + 1
            display.text = next.toString()
            onUpdate(next)
            updateUI()
        }
    }

    private fun setupButtons() {
        binding.addPlayerBtn.setOnClickListener { addPlayer() }
        binding.importContactsBtn.setOnClickListener { pickContactLauncher.launch(null) }
        binding.clearAllBtn.setOnClickListener { clearAllPlayers() }
        binding.startGameBtn.setOnClickListener { startGame() }
        binding.manageWordsBtn.setOnClickListener {
            (activity as? MainActivity)?.showWordList()
        }
        binding.manageItemsBtn.setOnClickListener {
            (activity as? MainActivity)?.showDetectiveItems()
        }
        binding.rulesBtn.setOnClickListener {
            (activity as? MainActivity)?.showRules()
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
        if (name.isNotEmpty() && phone.isNotEmpty()) {
            gameRepository.addPlayer(Player(UUID.randomUUID().toString(), name, phone))
            binding.playerNameInput.text.clear()
            binding.phoneNumberInput.text.clear()
            loadPlayers()
        }
    }

    private fun importContact(uri: Uri) {
        try {
            val cursor = requireContext().contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                if (it.moveToFirst()) {
                    val id = it.getString(it.getColumnIndexOrThrow(ContactsContract.Contacts._ID))
                    val name = it.getString(it.getColumnIndexOrThrow(ContactsContract.Contacts.DISPLAY_NAME))
                    val pCursor = requireContext().contentResolver.query(
                        ContactsContract.CommonDataKinds.Phone.CONTENT_URI, null,
                        ContactsContract.CommonDataKinds.Phone.CONTACT_ID + " = ?", arrayOf(id), null)
                    pCursor?.use { pc ->
                        if (pc.moveToFirst()) {
                            val phone = pc.getString(pc.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.NUMBER))
                            gameRepository.addPlayer(Player(UUID.randomUUID().toString(), name, phone))
                            loadPlayers()
                        }
                    }
                }
            }
        } catch (e: Exception) { e.printStackTrace() }
    }

    private fun clearAllPlayers() {
        gameRepository.savePlayers(emptyList())
        loadPlayers()
    }

    private fun startGame() {
        val imp = binding.impostorCountDisplay.text.toString().toInt()
        val jester = binding.jesterCountDisplay.text.toString().toInt()
        val det = binding.detCountDisplay.text.toString().toInt()
        val items = binding.detItemsCountDisplay.text.toString().toInt()
        val doppel = binding.doppelCountDisplay.text.toString().toInt()
        (activity as? MainActivity)?.showGameStarting(imp, jester, det, items, doppel)
    }

    private fun updateUI() {
        binding.playersCountText.text = "Spieler: ${players.size}"
        val imp = binding.impostorCountDisplay.text.toString().toInt()
        val jester = binding.jesterCountDisplay.text.toString().toInt()
        val det = binding.detCountDisplay.text.toString().toInt()
        val doppel = binding.doppelCountDisplay.text.toString().toInt()
        val totalRoles = imp + jester + det + doppel
        binding.startGameBtn.isEnabled = players.size >= 3 && totalRoles < players.size
    }
}
