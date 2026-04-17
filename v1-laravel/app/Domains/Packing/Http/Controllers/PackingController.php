<?php

namespace App\Domains\Packing\Http\Controllers;

use App\Domains\Inventory\Models\Item;
use App\Domains\Order\Models\Order;
use App\Domains\Packing\Models\PackingJob;
use App\Domains\Packing\Models\PackingItem;
use App\Domains\Packing\Models\PackingTemplate;
use App\Domains\Packing\Services\PackingService;
use App\Domains\User\Models\Store;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PackingController extends Controller
{
    public function __construct(protected PackingService $packingService) {}

    public function index(Request $request)
    {
        $query = PackingJob::with('fromStore', 'creator');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $jobs = $query->latest()->paginate(20)->withQueryString();
        $statuses = config('packinglist.packing_statuses', [
            'draft' => 'Draft',
            'packing' => 'Packing',
            'packed' => 'Packed',
            'shipped' => 'Shipped',
        ]);
        $types = ['shipment' => 'Shipment', 'transfer' => 'Transfer', 'event' => 'Event'];

        return Inertia::render('Packing/Index', compact('jobs', 'statuses', 'types'));
    }

    public function create(Request $request)
    {
        $stores = Store::active()->get();
        $templates = PackingTemplate::with('items.item')->get();
        $orders = null;

        if ($request->filled('order_id')) {
            $order = Order::with('lines.item')->findOrFail($request->order_id);
        }

        return Inertia::render('Packing/Create', compact('stores', 'templates', 'order', 'orders'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'type' => 'nullable|in:shipment,transfer,event',
            'order_id' => 'nullable|exists:orders,id',
            'from_store_id' => 'nullable|exists:stores,id',
            'notes' => 'nullable|string|max:500',
            'template_id' => 'nullable|exists:packing_templates,id',
        ]);

        $job = null;
        if (!empty($data['order_id'])) {
            $order = Order::with('lines')->findOrFail($data['order_id']);
            $job = $this->packingService->createFromOrder($order, $data);
        } elseif (!empty($data['template_id'])) {
            $template = PackingTemplate::with('items')->findOrFail($data['template_id']);
            $job = $this->packingService->createFromTemplate($template, $data);
        } else {
            $job = $this->packingService->createBlank($data);
        }

        return redirect()->route('packing.show', $job)->with('success', 'Packing job created.');
    }

    public function show(PackingJob $job)
    {
        $job->load('items.item', 'fromStore', 'creator', 'order');
        $user = auth()->user();

        return Inertia::render('Packing/Show', compact('job', 'user'));
    }

    public function edit(PackingJob $job)
    {
        $stores = Store::active()->get();

        return Inertia::render('Packing/Edit', compact('job', 'stores'));
    }

    public function update(Request $request, PackingJob $job)
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'type' => 'required|in:shipment,transfer,event',
            'from_store_id' => 'nullable|exists:stores,id',
            'notes' => 'nullable|string|max:500',
        ]);

        $job->update($data);

        return redirect()->route('packing.show', $job)->with('success', 'Packing job updated.');
    }

    public function addItem(Request $request, PackingJob $job)
    {
        $data = $request->validate([
            'item_id' => 'required|exists:items,id',
            'quantity' => 'required|numeric|min:0.001',
            'notes' => 'nullable|string|max:200',
        ]);

        $item = Item::findOrFail($data['item_id']);
        $packingItem = $this->packingService->addItem($job, $item, $data['quantity']);

        if (!empty($data['notes'])) {
            $packingItem->update(['notes' => $data['notes']]);
        }

        return back()->with('success', "Item '{$item->name}' added.");
    }

    public function updateItem(Request $request, PackingJob $job, PackingItem $item)
    {
        abort_unless($item->packing_job_id === $job->id, 404);

        $data = $request->validate([
            'quantity' => 'nullable|numeric|min:0',
            'packed_qty' => 'nullable|numeric|min:0',
            'packed' => 'nullable|boolean',
            'notes' => 'nullable|string|max:200',
        ]);

        $this->packingService->updateItem($item, $data);

        return back()->with('success', 'Item updated.');
    }

    public function removeItem(PackingJob $job, PackingItem $item)
    {
        abort_unless($item->packing_job_id === $job->id, 404);
        $this->packingService->removeItem($item);

        return back()->with('success', 'Item removed.');
    }

    public function markAllPacked(PackingJob $job)
    {
        if (!$job->canStartPacking() && !$job->isPacking()) {
            return back()->with('error', 'Job cannot be packed in current status.');
        }

        $this->packingService->markAllPacked($job);

        return back()->with('success', 'All items marked as packed.');
    }

    public function markShipped(PackingJob $job)
    {
        if (!$job->isPacked()) {
            return back()->with('error', 'Job must be fully packed before shipping.');
        }

        $this->packingService->markShipped($job);

        return back()->with('success', 'Job marked as shipped.');
    }

    public function checklistPdf(PackingJob $job)
    {
        $checklist = $this->packingService->generateChecklist($job);

        return Inertia::render('Packing/ChecklistPdf', [
            'checklist' => $checklist,
        ]);
    }

    // Template CRUD
    public function templateIndex()
    {
        $templates = PackingTemplate::with('items.item', 'creator')->latest()->get();

        return Inertia::render('Packing/Templates/Index', compact('templates'));
    }

    public function templateCreate()
    {
        $items = Item::active()->orderBy('name')->get();

        return Inertia::render('Packing/Templates/Create', compact('items'));
    }

    public function templateStore(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.default_qty' => 'required|numeric|min:0.001',
        ]);

        $template = PackingTemplate::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'created_by' => auth()->id(),
        ]);

        foreach ($data['items'] as $item) {
            $template->items()->create([
                'item_id' => $item['item_id'],
                'default_qty' => $item['default_qty'],
            ]);
        }

        return redirect()->route('packing.templates.index')->with('success', 'Template created.');
    }

    public function templateEdit(PackingTemplate $template)
    {
        $template->load('items.item');
        $items = Item::active()->orderBy('name')->get();

        return Inertia::render('Packing/Templates/Edit', compact('template', 'items'));
    }

    public function templateUpdate(Request $request, PackingTemplate $template)
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.default_qty' => 'required|numeric|min:0.001',
        ]);

        $template->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        $template->items()->delete();
        foreach ($data['items'] as $item) {
            $template->items()->create([
                'item_id' => $item['item_id'],
                'default_qty' => $item['default_qty'],
            ]);
        }

        return redirect()->route('packing.templates.index')->with('success', 'Template updated.');
    }

    public function templateDestroy(PackingTemplate $template)
    {
        $template->delete();

        return back()->with('success', 'Template deleted.');
    }
}
