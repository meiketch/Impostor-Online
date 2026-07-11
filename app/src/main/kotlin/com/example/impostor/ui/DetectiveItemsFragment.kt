package com.example.impostor.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.RecyclerView
import com.example.impostor.data.DetectiveItem
import com.example.impostor.data.GameRepository
import com.example.impostor.databinding.FragmentDetectiveItemsBinding
import com.example.impostor.databinding.ItemDetectiveToolBinding

class DetectiveItemsFragment : Fragment() {
    private lateinit var binding: FragmentDetectiveItemsBinding
    private lateinit var gameRepository: GameRepository
    private lateinit var adapter: DetectiveItemsAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        binding = FragmentDetectiveItemsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        gameRepository = GameRepository(requireContext())
        adapter = DetectiveItemsAdapter(gameRepository.getDetectiveItems(), 
            onEdit = { item -> showAddEditItemDialog(item) },
            onDelete = { item ->
                val items = gameRepository.getDetectiveItems().toMutableList()
                items.remove(item)
                gameRepository.saveDetectiveItems(items)
                adapter.updateItems(items)
            }
        )
        binding.itemsRecyclerView.adapter = adapter
        binding.backBtn.setOnClickListener { parentFragmentManager.popBackStack() }
        binding.addItemBtn.setOnClickListener { showAddEditItemDialog() }
    }

    private fun showAddEditItemDialog(existingItem: DetectiveItem? = null) {
        val ctx = requireContext()
        val layout = LinearLayout(ctx).apply { orientation = LinearLayout.VERTICAL; setPadding(50, 20, 50, 0) }
        val nameInput = EditText(ctx).apply { 
            hint = "Name (z.B. 🔫 Pistole)"
            setText(existingItem?.name ?: "")
        }
        val descInput = EditText(ctx).apply { 
            hint = "Beschreibung"
            setText(existingItem?.description ?: "")
        }
        layout.addView(nameInput); layout.addView(descInput)
        
        AlertDialog.Builder(ctx)
            .setTitle(if (existingItem == null) "Neues Item" else "Item bearbeiten")
            .setView(layout)
            .setPositiveButton("Speichern") { _, _ ->
                val items = gameRepository.getDetectiveItems().toMutableList()
                if (existingItem != null) {
                    val index = items.indexOfFirst { it.name == existingItem.name }
                    if (index != -1) {
                        items[index] = DetectiveItem(nameInput.text.toString(), descInput.text.toString())
                    }
                } else {
                    items.add(DetectiveItem(nameInput.text.toString(), descInput.text.toString()))
                }
                gameRepository.saveDetectiveItems(items)
                adapter.updateItems(items)
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    inner class DetectiveItemsAdapter(private var items: List<DetectiveItem>, private val onEdit: (DetectiveItem) -> Unit, private val onDelete: (DetectiveItem) -> Unit) : RecyclerView.Adapter<DetectiveItemsAdapter.ViewHolder>() {
        inner class ViewHolder(val binding: ItemDetectiveToolBinding) : RecyclerView.ViewHolder(binding.root)
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ViewHolder(ItemDetectiveToolBinding.inflate(LayoutInflater.from(parent.context), parent, false))
        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = items[position]
            holder.binding.itemNameText.text = item.name
            holder.binding.itemDescText.text = item.description
            holder.binding.editItemBtn.setOnClickListener { onEdit(item) }
            holder.binding.deleteItemBtn.setOnClickListener { onDelete(item) }
        }
        override fun getItemCount() = items.size
        fun updateItems(newItems: List<DetectiveItem>) { items = newItems; notifyDataSetChanged() }
    }
}
