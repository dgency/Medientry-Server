import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

type FaqItem = {
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
};

type FaqCategory = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  faqs: FaqItem[];
};

type FaqCategoriesFieldProps = {
  value: unknown;
  onChange: (value: FaqCategory[]) => void;
};

const defaultFaqItem = (): FaqItem => ({
  question: '',
  answer: '',
  sortOrder: 1,
  isActive: true,
});

const defaultFaqCategory = (index: number): FaqCategory => ({
  id: `faq-category-${index + 1}`,
  title: '',
  description: '',
  sortOrder: index + 1,
  isActive: true,
  faqs: [defaultFaqItem()],
});

const normalizeFaqs = (value: unknown): FaqItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index): FaqItem | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;

      return {
        question: typeof candidate.question === 'string' ? candidate.question : '',
        answer: typeof candidate.answer === 'string' ? candidate.answer : '',
        sortOrder:
          typeof candidate.sortOrder === 'number' && Number.isFinite(candidate.sortOrder)
            ? candidate.sortOrder
            : index + 1,
        isActive: typeof candidate.isActive === 'boolean' ? candidate.isActive : true,
      };
    })
    .filter((item): item is FaqItem => Boolean(item))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));
};

const normalizeCategories = (value: unknown): FaqCategory[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index): FaqCategory | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;

      return {
        id:
          typeof candidate.id === 'string' && candidate.id.trim().length > 0
            ? candidate.id.trim()
            : `faq-category-${index + 1}`,
        title: typeof candidate.title === 'string' ? candidate.title : '',
        description:
          typeof candidate.description === 'string' ? candidate.description : '',
        sortOrder:
          typeof candidate.sortOrder === 'number' && Number.isFinite(candidate.sortOrder)
            ? candidate.sortOrder
            : index + 1,
        isActive: typeof candidate.isActive === 'boolean' ? candidate.isActive : true,
        faqs: normalizeFaqs(candidate.faqs),
      };
    })
    .filter((item): item is FaqCategory => Boolean(item))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,
      id: item.id || `faq-category-${index + 1}`,
      sortOrder: index + 1,
      faqs:
        item.faqs.length > 0
          ? item.faqs.map((faq, faqIndex) => ({
              ...faq,
              sortOrder: faqIndex + 1,
            }))
          : [defaultFaqItem()],
    }));
};

const withNormalizedFaqOrder = (faqs: FaqItem[]) =>
  faqs.map((faq, index) => ({
    ...faq,
    sortOrder: index + 1,
  }));

const withNormalizedCategoryOrder = (categories: FaqCategory[]) =>
  categories.map((category, index) => ({
    ...category,
    id: category.id.trim() || `faq-category-${index + 1}`,
    sortOrder: index + 1,
    faqs:
      category.faqs.length > 0
        ? withNormalizedFaqOrder(category.faqs)
        : [defaultFaqItem()],
  }));

export function FaqCategoriesField({
  value,
  onChange,
}: FaqCategoriesFieldProps) {
  const categories = normalizeCategories(value);

  const updateCategories = (nextCategories: FaqCategory[]) => {
    onChange(withNormalizedCategoryOrder(nextCategories));
  };

  const updateCategory = (index: number, patch: Partial<FaqCategory>) => {
    updateCategories(
      categories.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, ...patch } : category,
      ),
    );
  };

  const moveCategory = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= categories.length) {
      return;
    }

    const nextCategories = [...categories];
    const [item] = nextCategories.splice(index, 1);
    nextCategories.splice(nextIndex, 0, item);
    updateCategories(nextCategories);
  };

  const updateFaqs = (categoryIndex: number, nextFaqs: FaqItem[]) => {
    updateCategory(categoryIndex, {
      faqs: withNormalizedFaqOrder(nextFaqs),
    });
  };

  const updateFaq = (
    categoryIndex: number,
    faqIndex: number,
    patch: Partial<FaqItem>,
  ) => {
    updateFaqs(
      categoryIndex,
      categories[categoryIndex].faqs.map((faq, currentFaqIndex) =>
        currentFaqIndex === faqIndex ? { ...faq, ...patch } : faq,
      ),
    );
  };

  const moveFaq = (
    categoryIndex: number,
    faqIndex: number,
    direction: -1 | 1,
  ) => {
    const faqs = categories[categoryIndex].faqs;
    const nextIndex = faqIndex + direction;

    if (nextIndex < 0 || nextIndex >= faqs.length) {
      return;
    }

    const nextFaqs = [...faqs];
    const [item] = nextFaqs.splice(faqIndex, 1);
    nextFaqs.splice(nextIndex, 0, item);
    updateFaqs(categoryIndex, nextFaqs);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Create FAQ categories and add multiple question-answer pairs under each section.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            updateCategories([...categories, defaultFaqCategory(categories.length)])
          }
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          No FAQ categories yet. Add a category to start building the page.
        </div>
      ) : null}

      <div className="space-y-5">
        {categories.map((category, categoryIndex) => (
          <div
            key={`${category.id}-${categoryIndex}`}
            className="rounded-2xl border border-border/70 bg-muted/20 p-4"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Category {categoryIndex + 1}
                </p>
                <p className="text-xs text-muted-foreground">
                  Display order: {category.sortOrder}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveCategory(categoryIndex, -1)}
                  disabled={categoryIndex === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveCategory(categoryIndex, 1)}
                  disabled={categoryIndex === categories.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateCategories(
                      categories.filter((_, index) => index !== categoryIndex),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Category Title</Label>
                <Input
                  value={category.title}
                  onChange={(event) =>
                    updateCategory(categoryIndex, { title: event.target.value })
                  }
                  placeholder="Admissions and eligibility"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Category Description</Label>
                <Textarea
                  rows={3}
                  value={category.description}
                  onChange={(event) =>
                    updateCategory(categoryIndex, {
                      description: event.target.value,
                    })
                  }
                  placeholder="Add a short intro for this FAQ group."
                />
              </div>

              <div className="space-y-2">
                <Label>Category ID</Label>
                <Input
                  value={category.id}
                  onChange={(event) =>
                    updateCategory(categoryIndex, { id: event.target.value })
                  }
                  placeholder="faq-category-1"
                />
              </div>

              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex min-h-11 items-center rounded-xl border border-input bg-white px-3">
                  <Switch
                    checked={category.isActive}
                    onCheckedChange={(checked) =>
                      updateCategory(categoryIndex, {
                        isActive: checked === true,
                      })
                    }
                  />
                  <span className="ml-3 text-sm text-muted-foreground">
                    {category.isActive ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border/70 bg-white/70 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    FAQs in this category
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add as many questions as you need under this category.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateFaqs(categoryIndex, [
                      ...category.faqs,
                      {
                        ...defaultFaqItem(),
                        sortOrder: category.faqs.length + 1,
                      },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add FAQ
                </Button>
              </div>

              <div className="space-y-4">
                {category.faqs.map((faq, faqIndex) => (
                  <div
                    key={`${category.id}-faq-${faqIndex}`}
                    className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          FAQ {faqIndex + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Display order: {faq.sortOrder}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => moveFaq(categoryIndex, faqIndex, -1)}
                          disabled={faqIndex === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => moveFaq(categoryIndex, faqIndex, 1)}
                          disabled={faqIndex === category.faqs.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateFaqs(
                              categoryIndex,
                              category.faqs.filter(
                                (_, index) => index !== faqIndex,
                              ),
                            )
                          }
                          disabled={category.faqs.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Question</Label>
                        <Input
                          value={faq.question}
                          onChange={(event) =>
                            updateFaq(categoryIndex, faqIndex, {
                              question: event.target.value,
                            })
                          }
                          placeholder="What documents are required to start the admission process?"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Answer</Label>
                        <Textarea
                          rows={4}
                          value={faq.answer}
                          onChange={(event) =>
                            updateFaq(categoryIndex, faqIndex, {
                              answer: event.target.value,
                            })
                          }
                          placeholder="Write a clear, professional answer for this question."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Active</Label>
                        <div className="flex min-h-11 items-center rounded-xl border border-input bg-white px-3">
                          <Switch
                            checked={faq.isActive}
                            onCheckedChange={(checked) =>
                              updateFaq(categoryIndex, faqIndex, {
                                isActive: checked === true,
                              })
                            }
                          />
                          <span className="ml-3 text-sm text-muted-foreground">
                            {faq.isActive ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
